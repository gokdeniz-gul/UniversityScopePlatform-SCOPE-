# 4.3 Database Design — Data Dictionary

The SCOPE platform's persistence layer is implemented on **PostgreSQL**, managed through the **Prisma ORM**. All primary keys are UUIDs generated server-side. Timestamps are stored with full timezone awareness (`TIMESTAMP WITH TIME ZONE`). The following subsections provide a formal data dictionary for each entity in the schema, preceded by the enumerated domain types.

---

## 4.3.1 Enumerated Domain Types

| Enum Name | Permissible Values | Usage |
|---|---|---|
| `Role` | `ADMIN`, `INSTRUCTOR`, `STUDENT` | Governs system-wide access privileges of a User account. |
| `ProjectStatus` | `DRAFT`, `PENDING_ADVISOR`, `ADVISOR_ASSIGNED`, `IN_PROGRESS`, `REVIEW_PHASE`, `COMPLETED` | Represents the current lifecycle stage of a Project, from initial creation through final completion. |
| `ApplicationStatus` | `PENDING`, `ACCEPTED`, `REJECTED` | Represents the decision state of both student project applications and instructor advisor requests. |
| `UserStatus` | `ACTIVE`, `INACTIVE` | Controls whether a User account is operationally enabled within the platform. |

---

## 4.3.2 Table: `User`

The central authentication and identity entity. Every actor in the system — students, instructors, and administrators — is represented by a single `User` record. Role-specific profile data is stored in separate extension tables linked by a one-to-one relationship.

| Column Name | Data Type | Key Type | Nullable | Description / Business Rule |
|---|---|---|---|---|
| `id` | `UUID` | PK | No | Universally unique identifier for the user account, generated automatically at creation via `uuid()`. |
| `email` | `VARCHAR` | Unique | No | The user's institutional or personal email address. Must be unique across the entire system; used as the primary login credential. |
| `password` | `VARCHAR` | — | No | The user's hashed password. Stored using `bcryptjs` hashing; the plaintext value is never persisted. |
| `name` | `VARCHAR` | — | No | The user's full legal name as it will appear on project listings and team rosters. |
| `role` | `Role` (Enum) | — | No | The user's system role, defaulting to `STUDENT` upon registration. Determines access to administrative and advisory features. |
| `status` | `UserStatus` (Enum) | — | No | The operational status of the account, defaulting to `ACTIVE`. An `INACTIVE` user cannot log in or perform any actions on the platform. |
| `createdAt` | `TIMESTAMP WITH TIME ZONE` | — | No | The exact timestamp at which the user account was created. Set automatically by the database at insert time. |
| `updatedAt` | `TIMESTAMP WITH TIME ZONE` | — | No | The timestamp of the most recent modification to the user record. Automatically maintained by Prisma ORM on every update operation. |

---

## 4.3.3 Table: `StudentProfile`

A one-to-one extension of the `User` entity that stores academic and professional profile information specific to students. A record in this table is created only when a user with the `STUDENT` role completes their profile setup.

| Column Name | Data Type | Key Type | Nullable | Description / Business Rule |
|---|---|---|---|---|
| `id` | `UUID` | PK | No | Universally unique identifier for the student profile record. |
| `userId` | `UUID` | FK, Unique | No | Foreign key referencing `User.id`. The `UNIQUE` constraint enforces the one-to-one cardinality with the `User` entity. Cascades on delete; removing the parent `User` removes this profile automatically. |
| `year` | `VARCHAR` | — | Yes | The student's current academic year (e.g., "3rd Year", "Graduate"). Nullable to allow incremental profile completion. |
| `department` | `VARCHAR` | — | Yes | The student's enrolled academic department (e.g., "Computer Engineering"). Used for filtering team advertisements. |
| `bio` | `TEXT` | — | Yes | A free-form personal biography for the student's public profile. Stored as long-form text with no character limit enforced at the database level. |
| `education` | `VARCHAR` | — | Yes | A summary of the student's educational background or degree programme. |
| `linkedinUrl` | `VARCHAR` | — | Yes | The URL to the student's LinkedIn profile. Stored as a plain string; format validation is enforced at the application layer. |
| `githubUrl` | `VARCHAR` | — | Yes | The URL to the student's GitHub profile. Used by project owners to evaluate a candidate's technical portfolio. |
| `technicalSkills` | `TEXT[]` | — | No | An ordered array of technical skill tags (e.g., `["Python", "React", "Docker"]`). Used to match students to projects listing required skills. Defaults to an empty array. |
| `interests` | `TEXT[]` | — | No | An ordered array of academic or professional interest tags. Used to surface relevant team advertisements to the student. Defaults to an empty array. |

---

## 4.3.4 Table: `AdvisorProfile`

A one-to-one extension of the `User` entity that stores academic and professional information specific to instructors acting as project advisors. A record in this table is created for users with the `INSTRUCTOR` role.

| Column Name | Data Type | Key Type | Nullable | Description / Business Rule |
|---|---|---|---|---|
| `id` | `UUID` | PK | No | Universally unique identifier for the advisor profile record. |
| `userId` | `UUID` | FK, Unique | No | Foreign key referencing `User.id`. The `UNIQUE` constraint enforces the one-to-one cardinality. Cascades on delete. |
| `title` | `VARCHAR` | — | Yes | The instructor's official academic title (e.g., "Associate Professor", "Research Assistant"). Displayed on the advisor's public listing. |
| `department` | `VARCHAR` | — | Yes | The instructor's faculty or department affiliation. Used to filter advisors by field of specialisation. |
| `isAvailable` | `BOOLEAN` | — | No | A flag indicating whether the advisor is currently accepting new project advisory requests. Defaults to `TRUE`. Project owners can only send requests to advisors with `isAvailable = TRUE`. |
| `expertise` | `TEXT[]` | — | No | An array of domain expertise keywords (e.g., `["Machine Learning", "Embedded Systems"]`). Defaults to an empty array. |
| `researchInterests` | `TEXT[]` | — | No | An array of research interest keywords. Used to match advisors with projects of a relevant academic scope. Defaults to an empty array. |
| `previousProjects` | `TEXT[]` | — | No | An array of strings describing previously supervised projects. Serves as a credibility indicator for students evaluating a potential advisor. Defaults to an empty array. |

---

## 4.3.5 Table: `Category`

A lookup/reference entity that classifies projects by their type or sponsoring body. Categories are managed by administrators and are referenced by projects.

| Column Name | Data Type | Key Type | Nullable | Description / Business Rule |
|---|---|---|---|---|
| `id` | `UUID` | PK | No | Universally unique identifier for the category record. |
| `name` | `VARCHAR` | Unique | No | The human-readable category name (e.g., "TÜBİTAK", "Teknofest", "Course Project", "Industry Collaboration"). Must be unique to prevent duplicate taxonomy entries. |
| `createdAt` | `TIMESTAMP WITH TIME ZONE` | — | No | The timestamp at which this category was created by an administrator. |

---

## 4.3.6 Table: `Project`

The primary aggregate entity of the platform. A project represents an academic or research initiative that a student owner creates, an advisor supervises, and a team of students executes.

| Column Name | Data Type | Key Type | Nullable | Description / Business Rule |
|---|---|---|---|---|
| `id` | `UUID` | PK | No | Universally unique identifier for the project record. |
| `title` | `VARCHAR` | — | No | The official title of the project as it appears on all platform listings. |
| `description` | `TEXT` | — | No | A full long-form description of the project's goals, scope, and expected outcomes. |
| `budget` | `VARCHAR` | — | Yes | An optional budget allocation for the project, stored as a formatted string to accommodate locale-specific representations (e.g., "15,000 TL"). Nullable for projects without an allocated budget. |
| `requiredSkills` | `TEXT[]` | — | No | An array of technical skill tags required for project contributors. Used to match student applicants to the project. Defaults to an empty array. |
| `status` | `ProjectStatus` (Enum) | — | No | The current lifecycle stage of the project. Defaults to `PENDING_ADVISOR`, as a newly created project must first be assigned an advisor before team formation can begin. |
| `categoryId` | `UUID` | FK | No | Foreign key referencing `Category.id`. Every project must belong to exactly one category. |
| `ownerId` | `UUID` | FK | No | Foreign key referencing `User.id` (named relation `ProjectOwner`). Identifies the student or user who created and owns the project. |
| `advisorId` | `UUID` | FK | Yes | Foreign key referencing `User.id` (named relation `ProjectAdvisor`). Identifies the assigned instructor advisor. Nullable because a newly created project has no advisor until the advisory request process is completed. |
| `createdAt` | `TIMESTAMP WITH TIME ZONE` | — | No | The timestamp at which the project was submitted to the platform. |
| `updatedAt` | `TIMESTAMP WITH TIME ZONE` | — | No | The timestamp of the most recent modification to any project field. Auto-maintained by Prisma ORM. |

---

## 4.3.7 Table: `TeamMember`

A join/association entity that implements the many-to-many relationship between `User` and `Project` for team membership. Each record represents a confirmed team member on a specific project.

| Column Name | Data Type | Key Type | Nullable | Description / Business Rule |
|---|---|---|---|---|
| `id` | `UUID` | PK | No | Universally unique identifier for the team membership record. |
| `projectId` | `UUID` | FK | No | Foreign key referencing `Project.id`. Cascades on delete; removing a project removes all associated team memberships. |
| `userId` | `UUID` | FK | No | Foreign key referencing `User.id`. Cascades on delete; removing a user removes their membership records. |
| `role` | `VARCHAR` | — | No | The functional role of this user within the project team (e.g., "Project Lead", "Frontend Developer", "Data Analyst"). |
| `joinedAt` | `TIMESTAMP WITH TIME ZONE` | — | No | The timestamp at which the user was added to the project team. |
| *(composite)* | — | Unique(`projectId`, `userId`) | — | A composite unique constraint ensuring that a given user can hold at most one membership record per project, preventing duplicate entries. |

---

## 4.3.8 Table: `TeamAd`

Represents a public recruitment advertisement posted for a project. A team advertisement is authored by the project owner to attract student applicants. The one-to-one relationship with `Project` ensures that each project may have at most one active advertisement.

| Column Name | Data Type | Key Type | Nullable | Description / Business Rule |
|---|---|---|---|---|
| `id` | `UUID` | PK | No | Universally unique identifier for the team advertisement record. |
| `projectId` | `UUID` | FK, Unique | No | Foreign key referencing `Project.id`. The `UNIQUE` constraint enforces the one-to-one cardinality: only one active advertisement is permitted per project. Cascades on delete. |
| `title` | `VARCHAR` | — | No | The headline of the team advertisement as displayed on the public browse page. |
| `description` | `TEXT` | — | No | A concise summary of the open positions and the project's goals, intended for the advertisement listing view. |
| `fullDescription` | `TEXT` | — | Yes | An extended, detailed description of the project, shown on the advertisement detail page. Nullable to allow posting an ad before the full description is finalised. |
| `projectType` | `VARCHAR` | — | Yes | An optional free-text classification of the project type (e.g., "Research", "Industry"). Exists as a separate field from `Category` for advertisement-specific display purposes. |
| `technicalSkills` | `TEXT[]` | — | No | An array of required or desirable technical skills for prospective applicants. Defaults to an empty array. |
| `interests` | `TEXT[]` | — | No | An array of domain interests relevant to the project, used to surface the advertisement to students with matching profiles. Defaults to an empty array. |
| `authorId` | `UUID` | FK | No | Foreign key referencing `User.id` (named relation `TeamAdAuthor`). Identifies the user who published the advertisement, typically the project owner. |
| `createdAt` | `TIMESTAMP WITH TIME ZONE` | — | No | The timestamp at which the advertisement was first published. |
| `updatedAt` | `TIMESTAMP WITH TIME ZONE` | — | No | The timestamp of the most recent modification to the advertisement. Auto-maintained by Prisma ORM. |

---

## 4.3.9 Table: `ProjectApplication`

Records a student's formal application to join a project team. The composite unique constraint enforces the business rule that a student may submit only one application per project, regardless of the number of roles requested.

| Column Name | Data Type | Key Type | Nullable | Description / Business Rule |
|---|---|---|---|---|
| `id` | `UUID` | PK | No | Universally unique identifier for the application record. |
| `projectId` | `UUID` | FK | No | Foreign key referencing `Project.id`. Cascades on delete; if a project is removed, all related applications are also removed. |
| `studentId` | `UUID` | FK | No | Foreign key referencing `User.id`. Identifies the student who submitted the application. Cascades on delete. |
| `requestedRoles` | `TEXT[]` | — | No | An array of role names for which the student is applying (e.g., `["Backend Developer", "Database Administrator"]`). A student may simultaneously express interest in multiple roles within a single application. |
| `status` | `ApplicationStatus` (Enum) | — | No | The current decision state of the application. Defaults to `PENDING` at submission. Transitions to `ACCEPTED` or `REJECTED` upon review by the project owner. |
| `appliedAt` | `TIMESTAMP WITH TIME ZONE` | — | No | The timestamp at which the student submitted the application. |
| *(composite)* | — | Unique(`projectId`, `studentId`) | — | A composite unique constraint enforcing the business rule that a student may not submit more than one application to the same project. |

---

## 4.3.10 Table: `AdvisorRequest`

Records a formal request from a project owner to an instructor, asking that instructor to serve as the project's academic advisor. A composite unique constraint prevents sending duplicate requests to the same advisor for the same project.

| Column Name | Data Type | Key Type | Nullable | Description / Business Rule |
|---|---|---|---|---|
| `id` | `UUID` | PK | No | Universally unique identifier for the advisor request record. |
| `projectId` | `UUID` | FK | No | Foreign key referencing `Project.id`. Cascades on delete; removing a project removes all outstanding advisor requests. |
| `advisorId` | `UUID` | FK | No | Foreign key referencing `User.id`. Identifies the instructor to whom the advisory request was sent. Cascades on delete. |
| `status` | `ApplicationStatus` (Enum) | — | No | The decision state of the request. Defaults to `PENDING`. Upon acceptance, the system updates `Project.advisorId` and advances `Project.status` to `ADVISOR_ASSIGNED`. |
| `message` | `TEXT` | — | Yes | An optional personalised message from the project owner to the prospective advisor, explaining why they were chosen and what the project involves. |
| `createdAt` | `TIMESTAMP WITH TIME ZONE` | — | No | The timestamp at which the request was submitted. |
| *(composite)* | — | Unique(`projectId`, `advisorId`) | — | A composite unique constraint ensuring that a project owner cannot send more than one pending request to the same instructor for the same project. |

---

## 4.3.11 Table: `Announcement`

A standalone, unidirectional broadcast entity. Announcements are created by administrators to inform platform users of opportunities, deadlines, or general news. This entity has no foreign key dependencies.

| Column Name | Data Type | Key Type | Nullable | Description / Business Rule |
|---|---|---|---|---|
| `id` | `UUID` | PK | No | Universally unique identifier for the announcement record. |
| `title` | `VARCHAR` | — | No | The headline of the announcement as it appears in notification feeds and listing pages. |
| `category` | `VARCHAR` | — | No | A plain-text classification label for the announcement (e.g., "TÜBİTAK", "Teknofest", "General"). Stored as a denormalized string rather than a foreign key, as announcements are independent of project categories. |
| `content` | `TEXT` | — | No | The full body content of the announcement. Stored as long-form text with no enforced character limit. |
| `createdAt` | `TIMESTAMP WITH TIME ZONE` | — | No | The timestamp at which the announcement was published by an administrator. |

---

## 4.3.12 Relationship Summary

| # | Entity A | Cardinality | Entity B | Mechanism |
|---|---|---|---|---|
| 1 | `User` | 1:1 | `StudentProfile` | `StudentProfile.userId` (Unique FK, Cascade Delete) |
| 2 | `User` | 1:1 | `AdvisorProfile` | `AdvisorProfile.userId` (Unique FK, Cascade Delete) |
| 3 | `User` (Owner) | 1:N | `Project` | `Project.ownerId` (Non-nullable FK) |
| 4 | `User` (Advisor) | 1:N | `Project` | `Project.advisorId` (Nullable FK) |
| 5 | `Category` | 1:N | `Project` | `Project.categoryId` (Non-nullable FK) |
| 6 | `User` | N:M | `Project` | Resolved via `TeamMember` join table |
| 7 | `Project` | 1:1 | `TeamAd` | `TeamAd.projectId` (Unique FK, Cascade Delete) |
| 8 | `User` (Author) | 1:N | `TeamAd` | `TeamAd.authorId` (Non-nullable FK) |
| 9 | `Project` | 1:N | `ProjectApplication` | `ProjectApplication.projectId` (Non-nullable FK) |
| 10 | `User` (Student) | 1:N | `ProjectApplication` | `ProjectApplication.studentId` (Non-nullable FK) |
| 11 | `Project` | 1:N | `AdvisorRequest` | `AdvisorRequest.projectId` (Non-nullable FK) |
| 12 | `User` (Advisor) | 1:N | `AdvisorRequest` | `AdvisorRequest.advisorId` (Non-nullable FK) |

> **Note:** The `Announcement` entity participates in no relationships and exists as a standalone table managed exclusively by administrators.
