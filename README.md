# JoEstate: Modern Real Estate Platform for Jordan

> **A specialized, web-based solution modernizing the property market in Jordan.**
> *Developed as a Graduation Project for the Department of Software Engineering, Jordan University of Science and Technology (JUST).*

---

## Overview

**JoEstate** is a full-stack web application designed to address the fragmentation and inefficiency of the Jordanian real estate market. Currently, buyers and renters rely on unorganized social media posts or general-purpose classifieds that lack specialized filters and structured data.

JoEstate bridges this gap by providing a **centralized, transparent, and user-centric platform**. It empowers property seekers with advanced search tools while giving owners and independent agents a professional dashboard to manage their portfolios.

## Key Features (MVP)

* **Secure Authentication:** Full JWT-based system with role-based access (Guest, Registered User, Admin).
* **Smart Search Engine:** Dynamic filtering by location, price range, property type, and amenities.
* **Comprehensive Listings:** Detailed property views with multi-image galleries, specifications, and owner contact info.
* **Favorites System:** Interactive feature allowing users to curate a personal watchlist of properties.
* **Public Profiles:** Dedicated portfolio pages for agents and owners to showcase their active listings.
* **Responsive Design:** Fully optimized UI for desktop and mobile devices.

## Technology Stack

This project utilizes a robust **Three-Tier Architecture**:

* **Frontend:** React.js, Tailwind CSS, Lucide Icons, Axios.
* **Backend:** Java 17, Spring Boot 3, Spring Security (JWT), Hibernate/JPA.
* **Database:** MySQL 8.0.
* **Tools:** Maven, Git, Postman.

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites

* Java Development Kit (JDK) 17 or higher
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
    * Open `src/main/resources/application.properties`.
    * Update the database credentials to match your local MySQL installation:
    ```properties
    spring.datasource.url=jdbc:mysql://localhost:3306/joestate_db
    spring.datasource.username=root
    spring.datasource.password=YOUR_MYSQL_PASSWORD
    ```

3.  **JWT & File Upload Configuration**
    * In the same `application.properties` file, add the following configuration to handle authentication and file uploads.
    * You can use the provided example secret key for local testing.

    ```properties
    # --- JWT Configuration ---
    # You can change this secret to any long random string for security
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
    ```bash
    mvn spring-boot:run
    ```

5.  **Run the Frontend**
    Open a new terminal, navigate to the frontend directory, and start the React server:
    ```bash
    cd frontend
    npm install
    npm start
    ```