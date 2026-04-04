# Medical Record System

A robust, scalable microservices-based application designed to manage medical facilities, personnel, patients, and clinical records. The system utilizes a modern distributed architecture, ensuring secure data access, high availability, and seamless service-to-service communication.

---

## 🏗 Architecture Overview

The system is built using Spring Boot and Spring Cloud, divided into focused microservices:

* **User Service (`user-service`):** Manages doctors, patients, and their relationships. Handles profile creation and health insurance validation.
* **Clinical Service (`clinical-service`):** Manages the core medical domain, including diagnoses, examinations, and the issuance of sick leaves. Synchronously communicates with the User Service via OpenFeign.
* **Discovery Server (`discovery-server`):** Netflix Eureka server for dynamic service registration and discovery.
* **API Gateway (`api-gateway`):** The single entry point for the frontend, handling request routing and CORS.
* **Frontend (`frontend-react`):** User interface for interacting with the system.

## 🛠 Tech Stack

**Backend:**
* Java 17+
* Spring Boot 3.x
* Spring Cloud (Netflix Eureka, OpenFeign, API Gateway)
* Spring Security & OAuth2 Resource Server
* Spring Data JPA (Hibernate)

**Infrastructure & Database:**
* PostgreSQL 15 (Relational Database)
* Keycloak 24 (Identity and Access Management / OAuth2 Provider)
* Docker & Docker Compose

---

## 🚀 Getting Started

### Prerequisites
* [Java 17](https://adoptium.net/) or higher
* [Docker](https://www.docker.com/) and Docker Compose
* [Gradle](https://gradle.org/)

### 1. Start Infrastructure
Run the database and identity provider using Docker Compose from the root directory:

```bash
cd docker
docker-compose up -d
```
* **PostgreSQL** will be available on port `5432`.
* **Keycloak** will be available on port `8080` (Admin credentials: `admin` / `admin`).

### 2. Configure Keycloak
1. Log in to the Keycloak Admin Console at `http://localhost:8080`.
2. Create a new realm named `medical-realm`.
3. Create an OpenID Connect client named `medical-frontend`.
4. Create your users, assign passwords, and ensure **Required User Actions** are cleared and **Email Verified** is toggled on.

### 3. Run Microservices
The services must be started in the following order to ensure proper registration:

1. **Discovery Server:**
   ```bash
   cd discovery-server
   ./gradlew bootRun
   ```
2. **User Service (Port 8081):**
   ```bash
   cd user-service
   ./gradlew bootRun
   ```
3. **Clinical Service (Port 8082):**
   ```bash
   cd clinical-service
   ./gradlew bootRun
   ```

---

## 📡 API Endpoints

*All endpoints require a valid JWT Bearer token from Keycloak.*

### User Service (`/api/...`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/doctors` | Register a new doctor |
| `GET` | `/doctors` | Retrieve all doctors |
| `POST` | `/patients` | Register a new patient and assign a GP |
| `GET` | `/patients` | Retrieve all patients |

### Clinical Service (`/api/...`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/examinations` | Create a new examination record |
| `GET` | `/examinations/patient/{id}` | Get examination history for a specific patient |
| `POST` | `/sick-leaves` | Issue a sick leave tied to an examination |

---

## 🔐 Security

This project implements robust security using **OAuth2** and **OpenID Connect** via Keycloak. 
* Microservices act as **Resource Servers** validating JWT signatures.
* Inter-service communication via OpenFeign requires token relay.
* No endpoints are accessible without a valid `access_token`.
