# University Scope Platform (SCOPE)

The University Scope Platform is a modern web application designed to digitize and optimize university ecosystem processes by centralizing key roles (Admin, Instructor, Student). 

Built with a focus on a highly scalable and type-safe architecture, this project utilizes Next.js, TypeScript, and PostgreSQL, with infrastructure and deployment standardized via Docker.

##  Key Features

- **Role-Based Access Control (RBAC):** The system features three distinct user roles (`ADMIN`, `INSTRUCTOR`, and `STUDENT`), providing isolated and secure interfaces for each.
- **Containerized Database:** The database (PostgreSQL) and management panel (pgAdmin) run on Docker, eliminating local dependency conflicts and ensuring a consistent environment.
- **Secure Environment Variables:** All sensitive data and database credentials are securely managed through `.env` files, completely isolated from the source code.
- **Modern Client Architecture:** Developed with TypeScript on the frontend to ensure robust type safety and minimize runtime errors.

##  Tech Stack

* **Frontend:** React, Next.js, TypeScript
* **Database:** PostgreSQL (v15-alpine)
* **Database Management:** pgAdmin4
* **DevOps / Infrastructure:** Docker, Docker Compose
* **Authentication:** JWT-Based Token Management
