import aiosqlite


async def seed_database(db_path: str) -> None:
    """Seed the database with realistic sample data."""
    async with aiosqlite.connect(db_path) as db:
        # -----------------------------------------------------------
        # Departments (5)
        # -----------------------------------------------------------
        departments = [
            ("Engineering", None, 1500000.00, "San Francisco"),
            ("Marketing", None, 800000.00, "New York"),
            ("Sales", None, 1200000.00, "Chicago"),
            ("HR", None, 600000.00, "San Francisco"),
            ("Finance", None, 900000.00, "New York"),
        ]
        await db.executemany(
            "INSERT INTO Departments (DepartmentName, ManagerID, Budget, Location) VALUES (?, ?, ?, ?)",
            departments,
        )

        # -----------------------------------------------------------
        # Employees (20)
        # -----------------------------------------------------------
        employees = [
            ("Alice", "Johnson", "alice.johnson@company.com", "415-555-0101", "2020-03-15", 145000.00, 1, None, "VP of Engineering"),
            ("Bob", "Smith", "bob.smith@company.com", "415-555-0102", "2019-07-22", 130000.00, 1, 1, "Senior Software Engineer"),
            ("Carol", "Williams", "carol.williams@company.com", "212-555-0201", "2021-01-10", 125000.00, 2, None, "Marketing Director"),
            ("David", "Brown", "david.brown@company.com", "312-555-0301", "2018-11-05", 120000.00, 3, None, "Sales Director"),
            ("Eva", "Martinez", "eva.martinez@company.com", "415-555-0103", "2022-06-18", 110000.00, 1, 1, "Software Engineer"),
            ("Frank", "Garcia", "frank.garcia@company.com", "212-555-0202", "2023-02-28", 95000.00, 2, 3, "Marketing Specialist"),
            ("Grace", "Lee", "grace.lee@company.com", "312-555-0302", "2021-09-14", 105000.00, 3, 4, "Sales Representative"),
            ("Henry", "Wilson", "henry.wilson@company.com", "415-555-0401", "2020-05-20", 115000.00, 4, None, "HR Director"),
            ("Ivy", "Anderson", "ivy.anderson@company.com", "212-555-0501", "2019-12-01", 135000.00, 5, None, "Finance Director"),
            ("Jack", "Thomas", "jack.thomas@company.com", "415-555-0104", "2023-08-07", 100000.00, 1, 2, "Software Engineer"),
            ("Karen", "Jackson", "karen.jackson@company.com", "312-555-0303", "2022-04-11", 98000.00, 3, 4, "Sales Representative"),
            ("Leo", "White", "leo.white@company.com", "212-555-0203", "2024-01-15", 92000.00, 2, 3, "Content Strategist"),
            ("Mia", "Harris", "mia.harris@company.com", "415-555-0105", "2024-03-20", 115000.00, 1, 1, "DevOps Engineer"),
            ("Nathan", "Clark", "nathan.clark@company.com", "415-555-0402", "2023-11-30", 88000.00, 4, 8, "HR Specialist"),
            ("Olivia", "Lewis", "olivia.lewis@company.com", "212-555-0502", "2021-07-25", 105000.00, 5, 9, "Financial Analyst"),
            ("Paul", "Robinson", "paul.robinson@company.com", "312-555-0304", "2024-06-01", 90000.00, 3, 4, "Sales Associate"),
            ("Quinn", "Walker", "quinn.walker@company.com", "415-555-0106", "2024-09-10", 108000.00, 1, 2, "Frontend Developer"),
            ("Rachel", "Hall", "rachel.hall@company.com", "212-555-0204", "2022-10-05", 97000.00, 2, 3, "Social Media Manager"),
            ("Sam", "Allen", "sam.allen@company.com", "212-555-0503", "2024-02-14", 100000.00, 5, 9, "Accountant"),
            ("Tina", "Young", "tina.young@company.com", "415-555-0403", "2023-05-22", 85000.00, 4, 8, "Recruiter"),
        ]
        await db.executemany(
            "INSERT INTO Employees (FirstName, LastName, Email, Phone, HireDate, Salary, DepartmentID, ManagerID, JobTitle) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            employees,
        )

        # Update department managers now that employees exist
        await db.execute("UPDATE Departments SET ManagerID = 1 WHERE DepartmentID = 1")
        await db.execute("UPDATE Departments SET ManagerID = 3 WHERE DepartmentID = 2")
        await db.execute("UPDATE Departments SET ManagerID = 4 WHERE DepartmentID = 3")
        await db.execute("UPDATE Departments SET ManagerID = 8 WHERE DepartmentID = 4")
        await db.execute("UPDATE Departments SET ManagerID = 9 WHERE DepartmentID = 5")

        # -----------------------------------------------------------
        # Customers (15)
        # -----------------------------------------------------------
        customers = [
            ("James", "Miller", "james.miller@email.com", "555-100-0001", "123 Oak St", "Los Angeles", "California", "90001", "2022-01-15"),
            ("Sarah", "Davis", "sarah.davis@email.com", "555-100-0002", "456 Pine Ave", "San Diego", "California", "92101", "2022-03-22"),
            ("Michael", "Taylor", "michael.taylor@email.com", "555-100-0003", "789 Elm Dr", "Austin", "Texas", "73301", "2021-11-08"),
            ("Emily", "Moore", "emily.moore@email.com", "555-100-0004", "321 Maple Ln", "Seattle", "Washington", "98101", "2023-05-14"),
            ("Daniel", "Anderson", "daniel.anderson@email.com", "555-100-0005", "654 Birch Rd", "Denver", "Colorado", "80201", "2022-07-30"),
            ("Jessica", "Thomas", "jessica.thomas@email.com", "555-100-0006", "987 Cedar Ct", "Portland", "Oregon", "97201", "2021-09-12"),
            ("Chris", "Jackson", "chris.jackson@email.com", "555-100-0007", "147 Walnut St", "Miami", "Florida", "33101", "2023-02-18"),
            ("Amanda", "White", "amanda.white@email.com", "555-100-0008", "258 Spruce Ave", "Boston", "Massachusetts", "02101", "2022-06-25"),
            ("Ryan", "Harris", "ryan.harris@email.com", "555-100-0009", "369 Ash Blvd", "Phoenix", "Arizona", "85001", "2023-08-03"),
            ("Laura", "Martin", "laura.martin@email.com", "555-100-0010", "741 Poplar Way", "San Francisco", "California", "94101", "2021-12-20"),
            ("Kevin", "Thompson", "kevin.thompson@email.com", "555-100-0011", "852 Willow Dr", "Chicago", "Illinois", "60601", "2022-10-11"),
            ("Nicole", "Garcia", "nicole.garcia@email.com", "555-100-0012", "963 Cypress Ln", "Sacramento", "California", "95814", "2023-04-07"),
            ("Brian", "Martinez", "brian.martinez@email.com", "555-100-0013", "159 Redwood Rd", "Atlanta", "Georgia", "30301", "2022-02-28"),
            ("Stephanie", "Robinson", "stephanie.robinson@email.com", "555-100-0014", "267 Sequoia Ct", "Nashville", "Tennessee", "37201", "2023-07-16"),
            ("Andrew", "Clark", "andrew.clark@email.com", "555-100-0015", "378 Magnolia St", "San Jose", "California", "95101", "2024-01-09"),
        ]
        await db.executemany(
            "INSERT INTO Customers (FirstName, LastName, Email, Phone, Address, City, State, ZipCode, JoinDate) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            customers,
        )

        # -----------------------------------------------------------
        # Products (10)
        # -----------------------------------------------------------
        products = [
            ("Laptop Pro 15", "Electronics", 1299.99, 50, "TechCorp"),
            ("Wireless Mouse", "Electronics", 29.99, 200, "TechCorp"),
            ("Standing Desk", "Furniture", 599.99, 30, "OfficePlus"),
            ("Ergonomic Chair", "Furniture", 449.99, 45, "OfficePlus"),
            ("USB-C Hub", "Electronics", 49.99, 150, "TechCorp"),
            ("Mechanical Keyboard", "Electronics", 89.99, 120, "KeyMasters"),
            ("Monitor 27 inch", "Electronics", 399.99, 75, "DisplayTech"),
            ("Desk Lamp LED", "Office Supplies", 34.99, 100, "BrightLight"),
            ("Notebook Pack 5", "Office Supplies", 12.99, 300, "PaperCo"),
            ("Webcam HD", "Electronics", 79.99, 90, "TechCorp"),
        ]
        await db.executemany(
            "INSERT INTO Products (ProductName, Category, Price, StockQuantity, SupplierName) "
            "VALUES (?, ?, ?, ?, ?)",
            products,
        )

        # -----------------------------------------------------------
        # Orders (15)
        # -----------------------------------------------------------
        orders = [
            (1, "2023-06-15", 1329.98, "Shipped", "123 Oak St, Los Angeles, CA 90001"),
            (2, "2023-07-20", 599.99, "Delivered", "456 Pine Ave, San Diego, CA 92101"),
            (3, "2023-08-05", 539.97, "Delivered", "789 Elm Dr, Austin, TX 73301"),
            (4, "2023-09-12", 449.99, "Shipped", "321 Maple Ln, Seattle, WA 98101"),
            (5, "2023-10-01", 1349.98, "Delivered", "654 Birch Rd, Denver, CO 80201"),
            (6, "2023-11-18", 79.99, "Pending", "987 Cedar Ct, Portland, OR 97201"),
            (7, "2024-01-10", 899.97, "Processing", "147 Walnut St, Miami, FL 33101"),
            (8, "2024-02-14", 1699.98, "Shipped", "258 Spruce Ave, Boston, MA 02101"),
            (1, "2024-03-05", 119.98, "Delivered", "123 Oak St, Los Angeles, CA 90001"),
            (10, "2024-04-22", 399.99, "Pending", "741 Poplar Way, San Francisco, CA 94101"),
            (11, "2024-05-15", 649.98, "Shipped", "852 Willow Dr, Chicago, IL 60601"),
            (3, "2024-06-30", 89.99, "Delivered", "789 Elm Dr, Austin, TX 73301"),
            (12, "2024-07-08", 1749.98, "Processing", "963 Cypress Ln, Sacramento, CA 95814"),
            (14, "2024-08-20", 64.98, "Pending", "267 Sequoia Ct, Nashville, TN 37201"),
            (15, "2024-09-01", 479.98, "Shipped", "378 Magnolia St, San Jose, CA 95101"),
        ]
        await db.executemany(
            "INSERT INTO Orders (CustomerID, OrderDate, TotalAmount, Status, ShippingAddress) "
            "VALUES (?, ?, ?, ?, ?)",
            orders,
        )

        # -----------------------------------------------------------
        # OrderItems (25)
        # -----------------------------------------------------------
        order_items = [
            (1, 1, 1, 1299.99),   # Order 1: Laptop Pro 15
            (1, 2, 1, 29.99),     # Order 1: Wireless Mouse
            (2, 3, 1, 599.99),    # Order 2: Standing Desk
            (3, 6, 3, 89.99),     # Order 3: 3x Mechanical Keyboard
            (3, 5, 2, 49.99),     # Order 3: 2x USB-C Hub (=99.98) -- note: partial to balance
            (4, 4, 1, 449.99),    # Order 4: Ergonomic Chair
            (5, 1, 1, 1299.99),   # Order 5: Laptop Pro 15
            (5, 5, 1, 49.99),     # Order 5: USB-C Hub
            (6, 10, 1, 79.99),    # Order 6: Webcam HD
            (7, 7, 1, 399.99),    # Order 7: Monitor 27 inch
            (7, 3, 1, 599.99),    # Order 7: Standing Desk -- partial
            (8, 1, 1, 1299.99),   # Order 8: Laptop Pro 15
            (8, 7, 1, 399.99),    # Order 8: Monitor 27 inch
            (9, 6, 1, 89.99),     # Order 9: Mechanical Keyboard
            (9, 2, 1, 29.99),     # Order 9: Wireless Mouse
            (10, 7, 1, 399.99),   # Order 10: Monitor 27 inch
            (11, 3, 1, 599.99),   # Order 11: Standing Desk
            (11, 5, 1, 49.99),    # Order 11: USB-C Hub
            (12, 6, 1, 89.99),    # Order 12: Mechanical Keyboard
            (13, 1, 1, 1299.99),  # Order 13: Laptop Pro 15
            (13, 4, 1, 449.99),   # Order 13: Ergonomic Chair
            (14, 8, 1, 34.99),    # Order 14: Desk Lamp LED
            (14, 2, 1, 29.99),    # Order 14: Wireless Mouse
            (15, 4, 1, 449.99),   # Order 15: Ergonomic Chair
            (15, 2, 1, 29.99),    # Order 15: Wireless Mouse
        ]
        await db.executemany(
            "INSERT INTO OrderItems (OrderID, ProductID, Quantity, UnitPrice) "
            "VALUES (?, ?, ?, ?)",
            order_items,
        )

        await db.commit()
