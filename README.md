# JoEstate: Modern Real Estate Platform for Jordan

> **A specialized, web-based solution modernizing the property market in Jordan.**
> *Developed as a Graduation Project for the Department of Software Engineering, Jordan University of Science and Technology (JUST).*

---

## Overview

**JoEstate** is a full-stack web application designed to address the fragmentation and inefficiency of the Jordanian real estate market. Currently, buyers and renters rely on unorganized social media posts or general-purpose classifieds that lack specialized filters and structured data.

JoEstate bridges this gap by providing a **centralized, transparent, and user-centric platform**. It empowers property seekers with advanced search tools, equips owners and independent agents with a professional dashboard to manage their portfolios, and utilizes an enterprise-grade backend to ensure secure communications and robust administrative moderation.

---

## Key Features

### 🏡 Core Platform & Property Management
* **Secure Authentication:** JWT-based architecture with strict role-based access control (Guest, Registered User, Admin).
* **Smart Search Engine:** Dynamic filtering by location, price range, property type, and amenities, featuring order-agnostic location matching.
* **Comprehensive Listings:** Detailed property views with multi-image galleries, lifecycle tracking (Active, Sold, Rented), and dynamic Google Maps integrations.
* **Favorites System:** Interactive UI allowing users to curate a personal watchlist of properties.

### 💬 Real-Time Communication
* **Peer-to-Peer Messaging:** Secure, real-time chat threads between buyers and property owners utilizing WebSockets.
* **Smart Inbox:** Automated read-receipt algorithms and unread message counters.
* **Global Notification Engine:** Real-time system alerts for new messages, administrative actions, and favorited properties.

### 💎 Premium & Monetization
* **Tiered Subscription Model:** Free users are limited to basic uploads (10 photos), while Premium users unlock expanded storage (up to 50 media files).
* **Smart Seller Dashboard:** An integrated Analytics Engine tracking unique listing views, active wishlists, and hot leads (phone clicks) using local device fingerprinting.
* **Automated Auditing:** Scheduled background Cron Jobs that execute nightly to manage and revoke expired Premium subscriptions automatically.
* **Enterprise Verification:** A dedicated workflow for agencies to apply for and receive verified "Blue Checkmark" badges.

### 🛡️ Trust & Safety (Admin Command Center)
* **Zendesk-Style Moderation Queue:** A multi-tab ticket system with concurrency locks (preventing race conditions between multiple admins).
* **Granular Restrictions:** Administrators can apply targeted bans (e.g., mute messaging, mute publishing, or full platform ban) that cascade to automatically suspend the user's active properties.
* **Live Audit Feed:** A real-time chronological log of all administrative actions, backed by mandatory justification notes for permanent accountability.
* **Spam Prevention:** Algorithmic 30-minute cooldowns preventing malicious users from flooding the reporting queue.

---

## Technology Stack

This project is built on a highly scalable **Three-Tier Architecture**, enforcing strict Separation of Concerns.

* **Frontend:** React.js (v19), Vite, Tailwind CSS, Lucide Icons, Axios, STOMP.js (WebSockets).
* **Backend:** Java 21, Spring Boot 3, Spring Security (JWT), Hibernate/JPA, Spring Data JPA, Spring WebSocket.
* **Database & Storage:** MySQL 8.0, Local File System Storage.
* **Automated Testing:** JUnit 5, Mockito.
* **Tools:** Maven, Git, Postman, IntelliJ IDEA.

---

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

* Java Development Kit (JDK) 21
* Node.js and npm
* MySQL Server

### Installation Steps

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/Musab-Od/JoEstate.git](https://github.com/Musab-Od/JoEstate.git)
    cd JoEstate
    ```

2.  **Database Configuration**
    * Create a MySQL database named `joestate_db`.
    * Create `src/main/resources/application.properties`.
    * Update the database credentials to match your local MySQL installation:
    ```properties
    spring.datasource.url=jdbc:mysql://localhost:3306/joestate_db
    spring.datasource.username=root
    spring.datasource.password=YOUR_MYSQL_PASSWORD
    ```

3.  **JWT & File Upload Configuration**
    * In the same `application.properties` file, ensure the following configurations are present to handle authentication and high-capacity file uploads:

    ```properties
    # --- JWT Configuration ---
    joestate.app.jwtSecret=7A24432646294A404E635266556A586E3272357538782F413F4428472B4B6250
    joestate.app.jwtExpirationMs=86400000

    # --- File Upload Limits ---
    spring.servlet.multipart.enabled=true
    spring.servlet.multipart.max-file-size=50MB
    spring.servlet.multipart.max-request-size=200MB

    # --- Server Tuning ---
    server.tomcat.max-http-form-post-size=200MB
    server.tomcat.max-swallow-size=-1
    server.tomcat.max-part-count=50
    ```

4.  **Run the Backend**
    Navigate to the backend root directory and start the Spring Boot server:
    ```bash
    mvn spring-boot:run
    ```

5.  **Run the Frontend**
    Open a new terminal, navigate to the frontend directory, install dependencies, and start the React development server:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### Running Automated Tests
To execute the comprehensive backend unit test suite (covering Services, Security, Cron Jobs, and Trust & Safety rules), run the following command in the backend directory:
```bash
mvn test