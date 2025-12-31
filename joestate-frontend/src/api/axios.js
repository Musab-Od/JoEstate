import axios from 'axios';

export default axios.create({
    baseURL: 'http://localhost:8080/api', // The address of your Spring Boot
    headers: {
        'Content-Type': 'application/json'
    }
});