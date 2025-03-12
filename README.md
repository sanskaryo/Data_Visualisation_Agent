# 📊 GLA University Placement Data Analysis

This project is a web application designed to analyze and visualize placement statistics for GLA University. It enables users to explore placement data, student performance, and company hiring trends through interactive charts and queries.

---

## 🚀 Features

- **📂 Data Ingestion**: Reads placement data from a CSV file and seeds it into a PostgreSQL database.
- **🔎 Query System**: Users can search or select from suggested queries to analyze placement trends.
- **📊 Data Visualization**: Supports Bar, Line, Pie, Scatter, and Area charts using Recharts.
- **📌 Information Display**: Provides insights on placements, company offers, and student records.

---

## 🏗 Components

### 🔹 ProjectInfo Component
Displays project details and a reference to GLA University.

### 🔹 Search Component
A search bar where users can enter queries to retrieve specific placement data.

### 🔹 SuggestedQueries Component
Predefined queries to help users explore key insights quickly.


### 🔹 DynamicChart Component
Generates dynamic charts based on selected queries using Recharts.

### 🔹 ChartWrapper Component
Wraps the `DynamicChart` component and manages client-side rendering.

### 🔹 Seed Script
Reads a CSV file and populates the PostgreSQL database with placement data.

---