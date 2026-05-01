# Banking Application Simulation

## Overview

This project is a full-stack banking application simulation developed as an academic team project over approximately three months.

The main goal of the project was to build a realistic banking platform where users can manage bank accounts, view transaction history, perform different types of transfers, and interact with the application based on their role.

The application was designed to simulate real banking features while also applying important software development concepts such as authentication, role-based access control, backend architecture, database management, frontend routing, and responsive user interface design.

This repository is shared as a work sample to demonstrate my experience with full-stack development, collaborative teamwork, and practical problem-solving in a real project environment.

---

## Project Context

This project was completed as part of my academic training in computer programming. It was developed collaboratively with teammates, and each member contributed to different parts of the application.

The project helped me gain hands-on experience with building a complete application from the frontend to the backend. It also allowed me to practice working with Git, managing features, fixing bugs, improving the user interface, and connecting the frontend with backend APIs.

This repository presents the project as a portfolio sample for employers.

---

## Main Features

### Authentication and User Roles

The application includes an authentication system that allows users to log in securely and access features based on their role.

The main roles used in the application are:

- Client
- Student/Supervisor

Clients can access their own banking information, while student supervisors can view and manage client-related information depending on their permissions.

Role-based access was an important part of the project because different users should not have access to the same actions. For example, some management actions are available only to student supervisors and not to regular clients.

---

## Banking Features

### Account Management

Users can view their bank accounts, including account type, balance, and account information.

The application supports different account types such as:

- Chequing account
- Savings account
- Credit account

The account section was built to give users a clear overview of their banking information in a structured and easy-to-understand interface.

---

### Transaction History

The application includes a transaction history page where users can view past transactions.

Transactions can be displayed with useful details such as:

- Transaction type
- Amount
- Date and time
- Account involved
- Transaction direction
- Status

The goal was to make the history page clear and practical, similar to what a user would expect in a real banking application.

---

### Transfers

The project includes different types of transfer simulations.

Supported transfer types include:

- Internal transfers between accounts
- Interac transfer simulation
- Bill payment simulation

The transfer system was designed to handle different cases depending on the selected transfer type. For example, internal transfers move money between accounts, while external Interac transfers and bill payments follow different simulation rules.

---

### Scheduled Transactions

The application supports future or scheduled transactions.

Users can schedule recurring transfers based on a selected frequency, such as:

- Weekly
- Monthly

This feature was added to simulate automatic banking operations and to give users the ability to manage future payments or transfers.

---

### Client Supervision

The student/supervisor role allows a user to access a list of clients and view selected client information.

This part of the project demonstrates role-based navigation and controlled access to client data.

The supervisor view was designed to allow a student user to move between the client list, client accounts, and transaction history while keeping the interface consistent.

---

## Technologies Used

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- React components
- Responsive layout design

### Backend

- Node.js
- Express.js
- REST API architecture
- JWT authentication
- Password hashing with bcrypt

### Database

- SQLite
- DAO pattern
- SQL queries
- Relational data structure

### Tools and Workflow

- Git
- GitHub
- VS Code
- Team collaboration
- Branch-based development

---

## Architecture

The backend follows a structured architecture with a clear separation of responsibilities.

The project uses:

- Models
- DAO layer
- Services
- Controllers
- Routes
- Middleware

This structure helped organize the code and made the project easier to maintain, debug, and extend.

The frontend was also organized using reusable components, pages, routes, and helper functions to keep the interface consistent across different sections of the application.

---

## My Contributions

During this project, I contributed to different parts of the application, including frontend, backend, routing, UI improvements, and feature integration.

Some of my main contributions included:

- Working on role-based navigation between client and student/supervisor views
- Improving the dashboard and sidebar behavior
- Building and improving account display pages
- Working on transaction history features
- Contributing to transfer-related features
- Improving scheduled transaction display and logic
- Fixing routing issues between different user roles
- Improving UI consistency with Tailwind CSS
- Connecting frontend pages with backend API endpoints
- Testing features and debugging application errors
- Using Git and GitHub during team development

This project helped me improve my ability to work on a full-stack application and understand how frontend, backend, database, and authentication systems work together.

---

## What I Learned

This project gave me practical experience with several important software development concepts.

I learned how to:

- Build a full-stack application using modern web technologies
- Structure a backend with routes, controllers, services, models, and DAO files
- Use JWT authentication to protect routes
- Apply role-based access control
- Connect a frontend application to backend APIs
- Manage application state and routing in Next.js
- Use Tailwind CSS to build a clean and responsive interface
- Work with SQLite and relational data
- Debug frontend and backend issues
- Collaborate with teammates using Git and GitHub
- Present a technical project as a professional work sample

---

## Purpose of This Repository

The purpose of this repository is to present the banking application simulation as a work sample for employers.

It demonstrates my ability to:

- Understand and contribute to a full-stack project
- Work with both frontend and backend technologies
- Build user-focused features
- Follow an organized project architecture
- Collaborate in a team environment
- Solve technical problems during development

This repository is not a real banking system and is not intended for production use. It is a simulation created for learning and portfolio purposes.

---

## Important Note

This project was developed as a collaborative academic project.

The repository is shared to demonstrate my technical experience and project involvement. The work presented here reflects the project developed by the team, with my personal contributions described in the section above.

No real banking data is used in this application.
