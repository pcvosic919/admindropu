from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import dashboard, alerts, identity, security, reports, account_audit
from routers import auth, settings as settings_router

app = FastAPI(
    title="M365 Sentinel Platform API",
    description="Mock backend for the M365 Sentinel Platform MVP",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(alerts.router)
app.include_router(identity.router)
app.include_router(security.router)
app.include_router(reports.router)
app.include_router(account_audit.router)
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

@app.get("/")
def root():
    return {
        "name": "M365 Sentinel Platform API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
