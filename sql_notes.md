# MySQL Complete Notes — Basic to Advanced

---

## 1. Database & Table Basics

```sql
CREATE DATABASE db_name;
USE db_name;
DROP DATABASE db_name;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  gender ENUM('male','female','other'),
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

RENAME TABLE old_name TO new_name;
DROP TABLE table_name;
```

---

## 2. ALTER TABLE

```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(15);
ALTER TABLE users ADD COLUMN phone VARCHAR(15) AFTER email;
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users MODIFY COLUMN phone VARCHAR(20);
ALTER TABLE users AUTO_INCREMENT = 1000;

-- Constraints via ALTER
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email);
ALTER TABLE users ADD CONSTRAINT chk_dob CHECK (date_of_birth > '1990-01-01');
```

---

## 3. Constraints

| Constraint | Purpose |
|---|---|
| PRIMARY KEY | Unique + not null, one per table |
| FOREIGN KEY | Links to another table's PK |
| UNIQUE | No duplicate values |
| CHECK | Validates a condition |
| NOT NULL | Column can't be empty |
| DEFAULT | Auto-fills if no value given |

```sql
-- Composite UNIQUE (uniqueness across combination of columns)
ALTER TABLE address ADD CONSTRAINT unique_user_pincode UNIQUE (user_id, pincode);

-- Foreign Key with CASCADE
CREATE TABLE address (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  street VARCHAR(100),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 4. INSERT

```sql
INSERT INTO users VALUES (1, 'Aditya', 'a@x.com', ...);
INSERT INTO users (name, email) VALUES ('Aditya', 'a@x.com');

-- Multiple rows in one statement
INSERT INTO users (name, email) VALUES
('A', 'a@x.com'),
('B', 'b@x.com');

-- Insert from another table
INSERT INTO archived_users (name, email)
SELECT name, email FROM users WHERE is_active = 0;
```

**Bulk load from file:**
```sql
LOAD DATA INFILE 'C:/path/file.csv'
INTO TABLE users
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
```
> Needs file inside `secure_file_priv` folder (check via `SHOW VARIABLES LIKE 'secure_file_priv';`)

---

## 5. SELECT — Filtering & Sorting

```sql
SELECT * FROM users WHERE gender IN ('Male','Female');
SELECT * FROM users WHERE date_of_birth BETWEEN '1995-01-01' AND '2010-01-01';
SELECT * FROM users WHERE gender='Male' ORDER BY salary DESC LIMIT 4;
SELECT * FROM users WHERE name LIKE 'A%';       -- starts with A (index-friendly)
SELECT * FROM users WHERE name LIKE '%son';     -- ends with son (NOT index-friendly)
```

---

## 6. UPDATE / DELETE

```sql
UPDATE users SET name = 'Aditya' WHERE email = 'a@x.com';
UPDATE users SET salary = salary + 10000 WHERE salary < 60000;
DELETE FROM users WHERE id = 5;
```

---

## 7. Transactions & ACID

```sql
START TRANSACTION;   -- or BEGIN; (identical)
UPDATE accounts SET balance = balance - 5000 WHERE id = 1;
UPDATE accounts SET balance = balance + 5000 WHERE id = 2;
COMMIT;      -- makes changes permanent
ROLLBACK;    -- undoes changes since START TRANSACTION

-- Savepoints (partial rollback)
START TRANSACTION;
UPDATE t SET x=1 WHERE id=1;
SAVEPOINT sp1;
UPDATE t SET x=2 WHERE id=2;
ROLLBACK TO sp1;   -- undoes only the update after sp1
COMMIT;
```

**ACID Properties:**
| Property | Meaning |
|---|---|
| Atomicity | All statements succeed or none do |
| Consistency | DB moves between valid states (constraints never broken) |
| Isolation | Concurrent transactions don't see each other's uncommitted changes |
| Durability | Once committed, survives crashes |

**Isolation levels:** READ UNCOMMITTED → READ COMMITTED → REPEATABLE READ (MySQL default) → SERIALIZABLE

**Autocommit:**
```sql
SET autocommit = 0;   -- manual control, must COMMIT/ROLLBACK explicitly
```

> Important: MySQL does NOT auto-rollback a transaction just because one statement fails — earlier successful statements stay pending until you explicitly COMMIT or ROLLBACK.

---

## 8. Aggregate Functions & GROUP BY / HAVING

```sql
SELECT COUNT(*) FROM users;
SELECT MIN(salary), MAX(salary) FROM users;
SELECT SUM(salary) FROM users;
SELECT AVG(salary) FROM users;

SELECT gender, SUM(salary) AS total FROM users GROUP BY gender;
SELECT gender, COUNT(*) FROM users GROUP BY gender HAVING COUNT(*) > 5;
```

**WHERE vs HAVING:**
| | WHERE | HAVING |
|---|---|---|
| Filters | Rows (before grouping) | Groups (after aggregation) |
| Can use aggregate function? | ❌ No | ✅ Yes |

> Every non-aggregated column in SELECT must appear in GROUP BY, or it's undefined/error (`ONLY_FULL_GROUP_BY`).

---

## 9. String & Date Functions

```sql
SELECT name, LENGTH(name) FROM users;
SELECT name, LOWER(name) FROM users;
SELECT CONCAT(LOWER(name), '123') AS username FROM users;
SELECT name, NOW() AS current_time FROM users;
SELECT YEAR(date_of_birth), MONTH(date_of_birth), DAY(date_of_birth) FROM users;
```

> ⚠️ Wrapping an indexed column in a function (`WHERE YEAR(date)=2020`) disables index usage. Prefer range conditions: `WHERE date BETWEEN '2020-01-01' AND '2020-12-31'`.

---

## 10. JOINS

| Type | Returns |
|---|---|
| INNER JOIN | Only matching rows from both sides |
| LEFT JOIN | All left rows + matches (NULL if none) |
| RIGHT JOIN | All right rows + matches (NULL if none) |
| SELF JOIN | Same table joined to itself via alias |

```sql
-- INNER
SELECT u.name, a.city FROM users u
INNER JOIN address a ON u.id = a.user_id;

-- LEFT (all users, even without address)
SELECT u.name, a.city FROM users u
LEFT JOIN address a ON u.id = a.user_id;

-- Find unmatched rows (users with NO address)
SELECT u.name FROM users u
LEFT JOIN address a ON u.id = a.user_id
WHERE a.id IS NULL;

-- SELF JOIN (employee -> manager)
SELECT a.name AS employee, b.name AS manager
FROM employees a
LEFT JOIN employees b ON a.manager_id = b.id;

-- Self join to find pairs (avoid mirrored duplicates)
SELECT a.name, b.name
FROM employees a
JOIN employees b ON a.dept_id = b.dept_id AND a.id < b.id;
```

> Rule: JOIN needs `ON` for the relationship; `WHERE` is only for filtering afterward. Mixing them or omitting `ON` is a syntax error.

> In a chain of joins, one INNER JOIN in the middle can silently drop rows that earlier LEFT JOINs preserved.

---

## 11. UNION / UNION ALL

```sql
SELECT name FROM users
UNION                    -- removes duplicates
SELECT name FROM admins;

SELECT name FROM users
UNION ALL                -- keeps duplicates
SELECT name FROM admins;
```

---

## 12. Views

```sql
CREATE VIEW rich_users AS
SELECT * FROM users WHERE salary > 50000;

SELECT * FROM rich_users;   -- query like a normal table
DROP VIEW rich_users;
SHOW CREATE VIEW rich_users;  -- see its definition
```

---

## 13. Indexes

```sql
CREATE INDEX idx_name ON users(email);
DROP INDEX idx_name ON users;
SHOW INDEX FROM users;
```

**Types:**
| Type | Notes |
|---|---|
| PRIMARY KEY | Clustered in InnoDB — leaf nodes store full row |
| UNIQUE | No duplicates, not clustered |
| Normal/Secondary | Just speeds up lookup |
| Composite | Multi-column; leftmost-prefix rule applies |
| Covering | Index contains every column the query needs — avoids table lookup |
| Full-text | For text search (`MATCH...AGAINST`) |

**Leftmost-prefix rule** (composite index `(a, b)`):
- `WHERE a = ?` → ✅ uses index
- `WHERE a = ? AND b = ?` → ✅ uses index
- `WHERE b = ?` (alone) → ❌ index not used

**Covering index example:**
```sql
CREATE INDEX idx_covering ON dept_emp(dept_no, emp_no);
-- SELECT emp_no FROM dept_emp WHERE dept_no='d005'
-- EXPLAIN shows "Using index" — no table lookup needed
```

> Note: On InnoDB, a PRIMARY KEY lookup is already "covering" since the clustered index stores the full row.

---

## 14. Subqueries

```sql
-- Above average
SELECT * FROM users WHERE salary > (SELECT AVG(salary) FROM users);

-- IN vs EXISTS vs JOIN (compare performance for large tables)
SELECT * FROM employees WHERE emp_no IN (SELECT emp_no FROM salaries WHERE salary > 100000);
SELECT * FROM employees e WHERE EXISTS (SELECT 1 FROM salaries s WHERE s.emp_no=e.emp_no AND s.salary>100000);
SELECT DISTINCT e.* FROM employees e JOIN salaries s ON s.emp_no=e.emp_no WHERE s.salary>100000;
```

> Correlated subqueries re-run per outer row — expensive at scale. Derived tables/JOINs are set-based and usually faster.

> DISTINCT isn't free — it can force a temporary table + dedup pass. Prefer EXISTS/IN when JOIN would create duplicates.

---

## 15. Window Functions

```sql
-- RANK (skips numbers on tie) vs DENSE_RANK (no gaps) vs ROW_NUMBER (always unique)
SELECT name, dept, salary,
  RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rnk
FROM employees;

-- LAG (previous row's value)
SELECT emp_no, salary, from_date,
  LAG(salary) OVER (PARTITION BY emp_no ORDER BY from_date) AS previous_salary
FROM salaries;

-- Running/cumulative total
SELECT dept, name, salary,
  SUM(salary) OVER (PARTITION BY dept ORDER BY from_date) AS cumulative_salary
FROM employees;

-- Aggregate without ORDER BY = overall value per partition (not running)
SELECT dept, name, salary,
  AVG(salary) OVER (PARTITION BY dept) AS dept_avg
FROM employees;

-- Filtering a window function result requires wrapping in a subquery
SELECT * FROM (
  SELECT name, dept, salary,
    RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS rnk
  FROM employees
) ranked
WHERE rnk <= 3;
```

> PARTITION BY prevents window functions from mixing unrelated groups — without it, LAG/RANK/SUM treat the entire result as one sequence.

---

## 16. Query Optimization Cheat Sheet

**Diagnose first:**
```sql
EXPLAIN SELECT ...;
EXPLAIN ANALYZE SELECT ...;   -- actual execution stats
```
Watch for: `type=ALL` (full scan), high `rows`, `Extra: Using filesort` / `Using temporary`.

**Common fixes:**
| Problem | Fix |
|---|---|
| Function on indexed column (`YEAR(date)=2020`) | Rewrite as range (`date BETWEEN ...`) |
| Leading wildcard (`LIKE '%x'`) | Use `LIKE 'x%'` or full-text search |
| Correlated subquery | Convert to JOIN / derived table |
| Unfiltered history-table JOIN (fan-out) | Filter each history table to its current state before joining |
| N+1 queries (loop of individual queries) | Single query with JOIN/GROUP BY |
| Deep `OFFSET` pagination | Keyset pagination: `WHERE id > last_id ORDER BY id LIMIT 20` |
| Slow JOIN + pagination together | Limit-then-join: paginate the base table first, then join only those rows |
| `SELECT *` | Select only needed columns |
| Redundant indexes | Drop unused ones — every index slows down INSERT/UPDATE/DELETE |

> The optimizer is cost-based, not rule-based — it can legitimately choose a full scan over an available index if the estimated selectivity is too low (too many matching rows makes random-I/O index lookups costlier than a sequential scan).

> Always verify correctness (row count/data) before and after an optimization — a faster query that returns different results is a bug, not an improvement.

---

## 17. N+1 Problem

**Bad (loop of queries):**
```sql
SELECT dept_no FROM departments;          -- then per department:
SELECT COUNT(*) FROM dept_emp WHERE dept_no='d001';
SELECT COUNT(*) FROM dept_emp WHERE dept_no='d002'; -- ...N times
```

**Good (single query):**
```sql
SELECT d.dept_name, COUNT(*) 
FROM departments d
JOIN dept_emp de ON d.dept_no = de.dept_no
GROUP BY d.dept_name;
```

> Cost isn't just execution time — it's cumulative network round-trip latency (N round-trips vs 1).

---

## 18. information_schema — Metadata Queries

```sql
SHOW TABLES;
SHOW TABLES FROM db_name;
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='db_name';

SHOW CREATE TABLE users;
SHOW INDEX FROM users;

SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints WHERE table_name='users';

SELECT constraint_name, check_clause 
FROM information_schema.check_constraints WHERE constraint_schema='db_name';
```

---

## 19. Backend Integration Essentials (Node.js + MySQL)

```javascript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Always use parameterized queries (prevents SQL injection)
const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);

// Transactions from application code
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  await connection.query('UPDATE accounts SET balance=balance-? WHERE id=?', [amount, fromId]);
  await connection.query('UPDATE accounts SET balance=balance+? WHERE id=?', [amount, toId]);
  await connection.commit();
} catch (err) {
  await connection.rollback();
  throw err;
} finally {
  connection.release();
}
```

**Production principles:**
- Credentials in `.env`, never hardcoded
- Connection pool, not single connection
- Parameterized queries always (`?` placeholders)
- Layered structure: routes → controllers → services (SQL logic lives in services)
- Centralized error handling middleware
- Migrations for schema changes (not manual `CREATE TABLE` in production)

---

## Quick Interview One-Liners

- **WHERE vs HAVING:** WHERE filters rows before grouping; HAVING filters groups after aggregation.
- **INNER vs LEFT JOIN:** INNER returns only matches; LEFT preserves all left-table rows with NULLs for no match.
- **Composite index rule:** Leftmost-prefix — index only helps if the query uses columns starting from the left.
- **Covering index:** Query answered entirely from the index — no round-trip to the table.
- **Correlated subquery vs JOIN:** Correlated subquery runs per row (slow at scale); JOIN is set-based.
- **N+1 problem:** Real cost is network round-trips, not per-query execution time.
- **ACID:** Atomicity (all-or-nothing), Consistency (valid state), Isolation (no interference), Durability (survives crashes).
- **PARTITION BY:** Restarts window function calculation per group — without it, calculations mix across unrelated rows.
