from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta, timezone, date, time
from passlib.context import CryptContext
import jwt 

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.getenv("DB_NAME", "employee_management")]

# Create the main app without a prefix

# Create a router with the /api prefix
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def prepare_for_mongo(data):
    """Convert date/time objects to ISO strings for MongoDB"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, date) and not isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, time):
                data[key] = value.strftime('%H:%M:%S')
            elif isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

# Models
class UserRole(BaseModel):
    role: str  # admin, hr, employee

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "employee"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmployeeCreate(BaseModel):
    employee_id: str
    full_name: str
    email: EmailStr
    phone: str
    department: str
    designation: str
    date_of_joining: str
    salary: float
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    status: str = "active"

class Employee(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    full_name: str
    email: EmailStr
    phone: str
    department: str
    designation: str
    date_of_joining: str
    salary: float
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AttendanceCreate(BaseModel):
    employee_id: str
    date: str
    check_in: str
    check_out: Optional[str] = None
    status: str  # present, absent, half-day, leave

class Attendance(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: str
    date: str
    check_in: str
    check_out: Optional[str] = None
    status: str
    working_hours: Optional[float] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaveCreate(BaseModel):
    employee_id: str
    leave_type: str  # sick, casual, vacation
    start_date: str
    end_date: str
    reason: str
    days_count: int

class Leave(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    employee_id: str
    employee_name: str
    leave_type: str
    start_date: str
    end_date: str
    reason: str
    days_count: int
    status: str = "pending"  # pending, approved, rejected
    applied_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None

# Auth Routes
@api_router.post("/auth/register")
async def register(user: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user.password)
    
    # Create user
    user_obj = User(
        email=user.email,
        full_name=user.full_name,
        role=user.role
    )
    user_dict = user_obj.dict()
    user_dict["password"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_access_token({"user_id": user_obj.id, "email": user_obj.email, "role": user_obj.role})
    
    return {
        "token": token,
        "user": {
            "id": user_obj.id,
            "email": user_obj.email,
            "full_name": user_obj.full_name,
            "role": user_obj.role
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"user_id": user["id"], "email": user["email"], "role": user["role"]})
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "role": current_user["role"]
    }

# Employee Routes
@api_router.post("/employees", response_model=Employee)
async def create_employee(employee: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if employee_id exists
    existing = await db.employees.find_one({"employee_id": employee.employee_id})
    if existing:
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    
    employee_obj = Employee(**employee.dict())
    employee_dict = prepare_for_mongo(employee_obj.dict())
    await db.employees.insert_one(employee_dict)
    return employee_obj

@api_router.get("/employees", response_model=List[Employee])
async def get_employees(current_user: dict = Depends(get_current_user)):
    employees = await db.employees.find({"status": "active"}).to_list(1000)
    return [Employee(**emp) for emp in employees]

@api_router.get("/employees/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    employee = await db.employees.find_one({"id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return Employee(**employee)

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, employee_update: EmployeeCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing = await db.employees.find_one({"id": employee_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update_dict = prepare_for_mongo(employee_update.dict())
    await db.employees.update_one({"id": employee_id}, {"$set": update_dict})
    
    updated_employee = await db.employees.find_one({"id": employee_id})
    return Employee(**updated_employee)

@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.employees.update_one({"id": employee_id}, {"$set": {"status": "inactive"}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted successfully"}

# Attendance Routes
@api_router.post("/attendance", response_model=Attendance)
async def mark_attendance(attendance: AttendanceCreate, current_user: dict = Depends(get_current_user)):
    # Get employee details
    employee = await db.employees.find_one({"employee_id": attendance.employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check if attendance already marked
    existing = await db.attendance.find_one({
        "employee_id": attendance.employee_id,
        "date": attendance.date
    })
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already marked for this date")
    
    # Calculate working hours if check_out is provided
    working_hours = None
    if attendance.check_out:
        try:
            check_in_time = datetime.strptime(attendance.check_in, "%H:%M")
            check_out_time = datetime.strptime(attendance.check_out, "%H:%M")
            hours_diff = (check_out_time - check_in_time).total_seconds() / 3600
            working_hours = round(hours_diff, 2)
        except:
            pass
    
    attendance_obj = Attendance(
        employee_id=attendance.employee_id,
        employee_name=employee["full_name"],
        date=attendance.date,
        check_in=attendance.check_in,
        check_out=attendance.check_out,
        status=attendance.status,
        working_hours=working_hours
    )
    
    attendance_dict = prepare_for_mongo(attendance_obj.dict())
    await db.attendance.insert_one(attendance_dict)
    return attendance_obj

@api_router.get("/attendance", response_model=List[Attendance])
async def get_attendance(
    employee_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    
    attendance_records = await db.attendance.find(query).sort("date", -1).to_list(1000)
    return [Attendance(**record) for record in attendance_records]

@api_router.put("/attendance/{attendance_id}")
async def update_attendance(attendance_id: str, check_out: str, current_user: dict = Depends(get_current_user)):
    existing = await db.attendance.find_one({"id": attendance_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    # Calculate working hours
    working_hours = None
    try:
        check_in_time = datetime.strptime(existing["check_in"], "%H:%M")
        check_out_time = datetime.strptime(check_out, "%H:%M")
        hours_diff = (check_out_time - check_in_time).total_seconds() / 3600
        working_hours = round(hours_diff, 2)
    except:
        pass
    
    await db.attendance.update_one(
        {"id": attendance_id},
        {"$set": {"check_out": check_out, "working_hours": working_hours}}
    )
    
    return {"message": "Check-out recorded successfully", "working_hours": working_hours}

# Leave Routes
@api_router.post("/leaves", response_model=Leave)
async def apply_leave(leave: LeaveCreate, current_user: dict = Depends(get_current_user)):
    # Get employee details
    employee = await db.employees.find_one({"employee_id": leave.employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    leave_obj = Leave(
        employee_id=leave.employee_id,
        employee_name=employee["full_name"],
        leave_type=leave.leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date,
        reason=leave.reason,
        days_count=leave.days_count
    )
    
    leave_dict = prepare_for_mongo(leave_obj.dict())
    await db.leaves.insert_one(leave_dict)
    return leave_obj

@api_router.get("/leaves", response_model=List[Leave])
async def get_leaves(
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if status:
        query["status"] = status
    
    leaves = await db.leaves.find(query).sort("applied_at", -1).to_list(1000)
    return [Leave(**leave) for leave in leaves]

@api_router.put("/leaves/{leave_id}/approve")
async def approve_leave(leave_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.leaves.update_one(
        {"id": leave_id},
        {"$set": {
            "status": "approved",
            "reviewed_by": current_user["full_name"],
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    return {"message": "Leave approved successfully"}

@api_router.put("/leaves/{leave_id}/reject")
async def reject_leave(leave_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.leaves.update_one(
        {"id": leave_id},
        {"$set": {
            "status": "rejected",
            "reviewed_by": current_user["full_name"],
            "reviewed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    return {"message": "Leave rejected successfully"}

# Dashboard & Analytics Routes
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    total_employees = await db.employees.count_documents({"status": "active"})
    
    # Today's attendance
    today = datetime.now(timezone.utc).date().isoformat()
    present_today = await db.attendance.count_documents({"date": today, "status": "present"})
    
    # Pending leaves
    pending_leaves = await db.leaves.count_documents({"status": "pending"})
    
    # Recent leaves
    recent_leaves = await db.leaves.find({"status": "pending"}).sort("applied_at", -1).limit(5).to_list(5)
    
    # Department wise count
    pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$department", "count": {"$sum": 1}}}
    ]
    dept_stats = await db.employees.aggregate(pipeline).to_list(100)
    
    return {
        "total_employees": total_employees,
        "present_today": present_today,
        "pending_leaves": pending_leaves,
        "recent_leaves": [Leave(**leave) for leave in recent_leaves],
        "department_stats": dept_stats,
        "attendance_rate": round((present_today / total_employees * 100) if total_employees > 0 else 0, 2)
    }

@api_router.get("/reports/attendance")
async def get_attendance_report(
    month: str,
    year: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all attendance for the month
    start_date = f"{year}-{month.zfill(2)}-01"
    end_date = f"{year}-{month.zfill(2)}-31"
    
    attendance_records = await db.attendance.find({
        "date": {"$gte": start_date, "$lte": end_date}
    }).to_list(10000)
    
    # Group by employee
    employee_stats = {}
    for record in attendance_records:
        emp_id = record["employee_id"]
        if emp_id not in employee_stats:
            employee_stats[emp_id] = {
                "employee_id": emp_id,
                "employee_name": record["employee_name"],
                "present": 0,
                "absent": 0,
                "half_day": 0,
                "leave": 0,
                "total_hours": 0
            }
        
        employee_stats[emp_id][record["status"].replace("-", "_")] += 1
        if record.get("working_hours"):
            employee_stats[emp_id]["total_hours"] += record["working_hours"]
    
    return {
        "month": month,
        "year": year,
        "data": list(employee_stats.values())
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()