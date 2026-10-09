# Database Schema

Documentation for the sample SQLite database used by the SQL Query AI Agent.

---

## Table of Contents

- [Overview](#overview)
- [Tables](#tables)
  - [Departments](#departments)
  - [Employees](#employees)
  - [Customers](#customers)
  - [Products](#products)
  - [Orders](#orders)
  - [OrderItems](#orderitems)
- [Relationships](#relationships)
- [Entity-Relationship Description](#entity-relationship-description)
- [Sample Data Summary](#sample-data-summary)
- [Example Queries](#example-queries)

---

## Overview

The application ships with a pre-seeded SQLite database (`data/sample.db`) that models a small company with employees, departments, customers, products, and orders. This provides realistic data for demonstrating the AI agent's SQL generation capabilities.

The database contains **6 tables** with the following record counts:

| Table        | Rows |
|--------------|------|
| Departments  | 5    |
| Employees    | 20   |
| Customers    | 15   |
| Products     | 10   |
| Orders       | 15   |
| OrderItems   | 25   |

The schema is defined in `backend/app/database/schema.sql` and data is seeded by `backend/app/database/seed_data.py`. Both are applied automatically on first startup via `init_database()`.

---

## Tables

### Departments

Stores company departments with their budget and location.

| Column         | Type    | Constraints                 | Description                    |
|----------------|---------|-----------------------------|--------------------------------|
| DepartmentID   | INTEGER | PRIMARY KEY AUTOINCREMENT   | Unique department identifier   |
| DepartmentName | TEXT    | NOT NULL                    | Name of the department         |
| ManagerID      | INTEGER | FK → Employees(EmployeeID)  | Department manager (employee)  |
| Budget         | REAL    |                             | Annual department budget ($)   |
| Location       | TEXT    |                             | Office location/city           |

**Seeded data (5 rows)**:

| DepartmentID | DepartmentName | ManagerID | Budget       | Location       |
|--------------|----------------|-----------|--------------|----------------|
| 1            | Engineering    | 1         | 1,500,000.00 | San Francisco  |
| 2            | Marketing      | 3         | 800,000.00   | New York       |
| 3            | Sales          | 4         | 1,200,000.00 | Chicago        |
| 4            | HR             | 8         | 600,000.00   | San Francisco  |
| 5            | Finance        | 9         | 900,000.00   | New York       |

---

### Employees

Stores employee information with department assignment and management hierarchy.

| Column       | Type    | Constraints                       | Description                        |
|--------------|---------|-----------------------------------|------------------------------------|
| EmployeeID   | INTEGER | PRIMARY KEY AUTOINCREMENT         | Unique employee identifier         |
| FirstName    | TEXT    | NOT NULL                          | Employee's first name              |
| LastName     | TEXT    | NOT NULL                          | Employee's last name               |
| Email        | TEXT    | UNIQUE                            | Employee email address             |
| Phone        | TEXT    |                                   | Phone number                       |
| HireDate     | DATE   | NOT NULL                          | Date the employee was hired        |
| Salary       | REAL   |                                   | Annual salary ($)                  |
| DepartmentID | INTEGER | FK → Departments(DepartmentID)    | Department the employee belongs to |
| ManagerID    | INTEGER | FK → Employees(EmployeeID)        | Direct manager (self-referencing)  |
| JobTitle     | TEXT   |                                    | Employee's job title               |

**Seeded data (20 rows)** — employees span all 5 departments:

| Dept          | Employees                                                                                                     |
|---------------|---------------------------------------------------------------------------------------------------------------|
| Engineering   | Alice Johnson (VP), Bob Smith (Sr. Engineer), Eva Martinez (Engineer), Jack Thomas (Engineer), Mia Harris (DevOps), Quinn Walker (Frontend Dev) |
| Marketing     | Carol Williams (Director), Frank Garcia (Specialist), Leo White (Content Strategist), Rachel Hall (Social Media Mgr) |
| Sales         | David Brown (Director), Grace Lee (Rep), Karen Jackson (Rep), Paul Robinson (Associate)                       |
| HR            | Henry Wilson (Director), Nathan Clark (Specialist), Tina Young (Recruiter)                                    |
| Finance       | Ivy Anderson (Director), Olivia Lewis (Analyst), Sam Allen (Accountant)                                       |

**Salary range**: $85,000 (Tina Young) to $145,000 (Alice Johnson)  
**Hire date range**: 2018-11-05 (David Brown) to 2024-09-10 (Quinn Walker)

**Management hierarchy**:
- Department directors/VPs have `ManagerID = NULL` (top-level managers).
- Other employees report to their department's director or a senior team member.

---

### Customers

Stores customer contact information and address.

| Column     | Type    | Constraints               | Description                    |
|------------|---------|---------------------------|--------------------------------|
| CustomerID | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique customer identifier     |
| FirstName  | TEXT    | NOT NULL                  | Customer's first name          |
| LastName   | TEXT    | NOT NULL                  | Customer's last name           |
| Email      | TEXT    | UNIQUE                    | Customer email address         |
| Phone      | TEXT    |                           | Phone number                   |
| Address    | TEXT    |                           | Street address                 |
| City       | TEXT    |                           | City                           |
| State      | TEXT    |                           | State (full name)              |
| ZipCode    | TEXT    |                           | ZIP code                       |
| JoinDate   | DATE   |                           | Date the customer registered   |

**Seeded data (15 rows)** — customers across 10 U.S. states:

| State          | Customers |
|----------------|-----------|
| California     | 5 (Los Angeles, San Diego, San Francisco, Sacramento, San Jose) |
| Texas          | 1 (Austin) |
| Washington     | 1 (Seattle) |
| Colorado       | 1 (Denver) |
| Oregon         | 1 (Portland) |
| Florida        | 1 (Miami) |
| Massachusetts  | 1 (Boston) |
| Arizona        | 1 (Phoenix) |
| Illinois       | 1 (Chicago) |
| Georgia        | 1 (Atlanta) |
| Tennessee      | 1 (Nashville) |

**Join date range**: 2021-09-12 to 2024-01-09

---

### Products

Stores product catalog with pricing and inventory.

| Column        | Type    | Constraints               | Description                     |
|---------------|---------|---------------------------|---------------------------------|
| ProductID     | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique product identifier       |
| ProductName   | TEXT    | NOT NULL                  | Name of the product             |
| Category      | TEXT    |                           | Product category                |
| Price         | REAL    | NOT NULL                  | Unit price ($)                  |
| StockQuantity | INTEGER | DEFAULT 0                 | Current inventory count         |
| SupplierName  | TEXT    |                           | Name of the supplier            |

**Seeded data (10 rows)**:

| ProductID | ProductName         | Category        | Price     | Stock | Supplier     |
|-----------|---------------------|-----------------|-----------|-------|--------------|
| 1         | Laptop Pro 15       | Electronics     | 1,299.99  | 50    | TechCorp     |
| 2         | Wireless Mouse      | Electronics     | 29.99     | 200   | TechCorp     |
| 3         | Standing Desk       | Furniture       | 599.99    | 30    | OfficePlus   |
| 4         | Ergonomic Chair     | Furniture       | 449.99    | 45    | OfficePlus   |
| 5         | USB-C Hub           | Electronics     | 49.99     | 150   | TechCorp     |
| 6         | Mechanical Keyboard | Electronics     | 89.99     | 120   | KeyMasters   |
| 7         | Monitor 27 inch     | Electronics     | 399.99    | 75    | DisplayTech  |
| 8         | Desk Lamp LED       | Office Supplies | 34.99     | 100   | BrightLight  |
| 9         | Notebook Pack 5     | Office Supplies | 12.99     | 300   | PaperCo      |
| 10        | Webcam HD           | Electronics     | 79.99     | 90    | TechCorp     |

**Categories**: Electronics (6), Furniture (2), Office Supplies (2)  
**Suppliers**: TechCorp (4), OfficePlus (2), KeyMasters (1), DisplayTech (1), BrightLight (1), PaperCo (1)  
**Price range**: $12.99 to $1,299.99

---

### Orders

Stores customer orders with status tracking.

| Column          | Type    | Constraints                     | Description                       |
|-----------------|---------|---------------------------------|-----------------------------------|
| OrderID         | INTEGER | PRIMARY KEY AUTOINCREMENT       | Unique order identifier           |
| CustomerID      | INTEGER | NOT NULL, FK → Customers(CustomerID) | Customer who placed the order |
| OrderDate       | DATE    | NOT NULL                        | Date the order was placed         |
| TotalAmount     | REAL    |                                 | Total order value ($)             |
| Status          | TEXT    | DEFAULT 'Pending'               | Order status                      |
| ShippingAddress | TEXT    |                                 | Delivery address                  |

**Seeded data (15 rows)**:

| Status     | Count | Example Orders         |
|------------|-------|------------------------|
| Delivered  | 5     | Orders 2, 3, 5, 9, 12 |
| Shipped    | 4     | Orders 1, 4, 11, 15   |
| Pending    | 3     | Orders 6, 10, 14      |
| Processing | 2     | Orders 7, 13          |

**Date range**: 2023-06-15 to 2024-09-01  
**Total amount range**: $64.98 to $1,749.98  
**Repeat customers**: Customer 1 (2 orders), Customer 3 (2 orders)

---

### OrderItems

Junction table linking orders to products with quantity and pricing.

| Column      | Type    | Constraints                         | Description                       |
|-------------|---------|-------------------------------------|-----------------------------------|
| OrderItemID | INTEGER | PRIMARY KEY AUTOINCREMENT           | Unique line item identifier       |
| OrderID     | INTEGER | NOT NULL, FK → Orders(OrderID)      | Parent order                      |
| ProductID   | INTEGER | NOT NULL, FK → Products(ProductID)  | Product purchased                 |
| Quantity    | INTEGER | NOT NULL                            | Number of units                   |
| UnitPrice   | REAL    | NOT NULL                            | Price per unit at time of order   |

**Seeded data (25 rows)** — most popular products by order frequency:

| Product              | Times Ordered |
|----------------------|---------------|
| Laptop Pro 15        | 4             |
| Wireless Mouse       | 4             |
| Ergonomic Chair      | 3             |
| USB-C Hub            | 3             |
| Mechanical Keyboard  | 3             |
| Monitor 27 inch      | 3             |
| Standing Desk        | 3             |
| Webcam HD            | 1             |
| Desk Lamp LED        | 1             |

**Note**: `Notebook Pack 5` has zero orders in the seed data.

---

## Relationships

```
Departments 1 ──── N Employees      (Employees.DepartmentID → Departments.DepartmentID)
Employees   1 ──── N Employees      (Employees.ManagerID → Employees.EmployeeID)
Employees   1 ──── 1 Departments    (Departments.ManagerID → Employees.EmployeeID)
Customers   1 ──── N Orders         (Orders.CustomerID → Customers.CustomerID)
Orders      1 ──── N OrderItems     (OrderItems.OrderID → Orders.OrderID)
Products    1 ──── N OrderItems     (OrderItems.ProductID → Products.ProductID)
```

---

## Entity-Relationship Description

The database models a company from two perspectives:

### Internal (HR/Organization)

- The company has **Departments** (Engineering, Marketing, Sales, HR, Finance).
- Each department has a location and an annual budget.
- **Employees** belong to one department and may report to another employee (their manager).
- Each department has one designated manager (tracked via `Departments.ManagerID`).
- Department directors have `ManagerID = NULL` in the Employees table, indicating they are top-level.

### External (Sales/Commerce)

- **Customers** register with their contact and address information.
- Customers place **Orders**, each with a date, total amount, status, and shipping address.
- Each order contains one or more **OrderItems**, which link to **Products**.
- Products have a category, price, stock quantity, and supplier.
- `OrderItems.UnitPrice` stores the price at time of purchase (may differ from `Products.Price` if prices change).

The two sides of the model are independent — there is no direct relationship between Employees and Customers/Orders. This is realistic for a company where the internal HR system and the sales/order system are separate.

---

## Sample Data Summary

| Aspect                 | Details                                         |
|------------------------|-------------------------------------------------|
| Total records          | 90 rows across 6 tables                         |
| Date range             | 2018 (earliest hire) to 2024 (latest order)     |
| Geographic spread      | Employees: 3 cities; Customers: 11 states       |
| Price range (products) | $12.99 – $1,299.99                              |
| Salary range           | $85,000 – $145,000                              |
| Order statuses         | Pending, Processing, Shipped, Delivered          |
| Product categories     | Electronics, Furniture, Office Supplies          |
| Suppliers              | 6 unique suppliers                              |

The data is designed to support a variety of query types: aggregation (SUM, COUNT, AVG), filtering (WHERE), joins (across 2-3 tables), grouping (GROUP BY), sorting (ORDER BY), and subqueries.

---

## Example Queries

Here are natural language questions you can ask the agent, with the expected SQL they should produce:

### Basic Retrieval

**"Show me all employees"**
```sql
SELECT * FROM Employees;
```

**"What products do we sell?"**
```sql
SELECT ProductName, Category, Price FROM Products;
```

**"List all departments and their budgets"**
```sql
SELECT DepartmentName, Budget, Location FROM Departments;
```

### Filtering

**"Show me all customers from California"**
```sql
SELECT * FROM Customers WHERE State = 'California';
```

**"Which employees earn more than $120,000?"**
```sql
SELECT FirstName, LastName, Salary, JobTitle FROM Employees WHERE Salary > 120000;
```

**"Show me pending orders"**
```sql
SELECT * FROM Orders WHERE Status = 'Pending';
```

### Aggregation

**"How many employees are in each department?"**
```sql
SELECT d.DepartmentName, COUNT(e.EmployeeID) AS EmployeeCount
FROM Departments d
JOIN Employees e ON d.DepartmentID = e.DepartmentID
GROUP BY d.DepartmentName;
```

**"What is the average salary by department?"**
```sql
SELECT d.DepartmentName, AVG(e.Salary) AS AvgSalary
FROM Departments d
JOIN Employees e ON d.DepartmentID = e.DepartmentID
GROUP BY d.DepartmentName;
```

**"What is the total revenue from all orders?"**
```sql
SELECT SUM(TotalAmount) AS TotalRevenue FROM Orders;
```

### Joins

**"Show me all orders with customer names"**
```sql
SELECT c.FirstName, c.LastName, o.OrderID, o.OrderDate, o.TotalAmount, o.Status
FROM Orders o
JOIN Customers c ON o.CustomerID = c.CustomerID;
```

**"What products did customer James Miller order?"**
```sql
SELECT p.ProductName, oi.Quantity, oi.UnitPrice
FROM OrderItems oi
JOIN Orders o ON oi.OrderID = o.OrderID
JOIN Customers c ON o.CustomerID = c.CustomerID
JOIN Products p ON oi.ProductID = p.ProductID
WHERE c.FirstName = 'James' AND c.LastName = 'Miller';
```

**"List employees and their department names"**
```sql
SELECT e.FirstName, e.LastName, e.JobTitle, d.DepartmentName
FROM Employees e
JOIN Departments d ON e.DepartmentID = d.DepartmentID;
```

### Advanced

**"Who are the top 5 highest-paid employees?"**
```sql
SELECT FirstName, LastName, Salary, JobTitle
FROM Employees
ORDER BY Salary DESC
LIMIT 5;
```

**"Which products have never been ordered?"**
```sql
SELECT p.ProductName
FROM Products p
LEFT JOIN OrderItems oi ON p.ProductID = oi.ProductID
WHERE oi.OrderItemID IS NULL;
```

**"What is the most popular product by number of orders?"**
```sql
SELECT p.ProductName, COUNT(oi.OrderItemID) AS OrderCount
FROM Products p
JOIN OrderItems oi ON p.ProductID = oi.ProductID
GROUP BY p.ProductName
ORDER BY OrderCount DESC
LIMIT 1;
```

**"Show monthly revenue for 2024"**
```sql
SELECT strftime('%Y-%m', OrderDate) AS Month, SUM(TotalAmount) AS Revenue
FROM Orders
WHERE OrderDate >= '2024-01-01'
GROUP BY strftime('%Y-%m', OrderDate)
ORDER BY Month;
```

**"Which customers have placed more than one order?"**
```sql
SELECT c.FirstName, c.LastName, COUNT(o.OrderID) AS OrderCount
FROM Customers c
JOIN Orders o ON c.CustomerID = o.CustomerID
GROUP BY c.CustomerID
HAVING COUNT(o.OrderID) > 1;
```

### Multi-Turn Conversation

You can also ask follow-up questions that reference previous context:

1. "Show me all orders" → Returns all orders
2. "Now filter those by status = 'Shipped'" → Adds WHERE clause
3. "Also include the customer name" → Adds JOIN to Customers
4. "Sort by total amount descending" → Adds ORDER BY
