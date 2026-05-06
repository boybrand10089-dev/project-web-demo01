# Medical Equipment Manager

เว็บนี้ใช้ frontend เดิมร่วมกับ backend แบบ Node.js + Express และ MySQL

## 1. สร้างฐานข้อมูล

เปิด MySQL แล้วรันไฟล์:

```sql
SOURCE db/schema.sql;
```

หรือ copy SQL ใน `db/schema.sql` ไปรันใน MySQL Workbench/phpMyAdmin

## 2. ตั้งค่า environment

คัดลอก `.env.example` เป็น `.env` แล้วแก้ค่าให้ตรงกับ MySQL ของเครื่อง:

```text
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=medical_equipment_manager
```

## 3. ติดตั้ง dependencies

```bash
npm install
```

## 4. รันระบบ

```bash
npm start
```

จากนั้นเปิด:

```text
http://localhost:3000
```

## หมายเหตุ

- ข้อมูลผู้ใช้ อุปกรณ์ และคลังสินค้า ถูกเก็บใน MySQL แล้ว
- session ผู้ใช้ที่ login อยู่เก็บใน `sessionStorage` ของ browser
- GitHub Pages รัน backend/MySQL ไม่ได้ ถ้าจะ deploy จริงต้องใช้ hosting ที่รัน Node.js และต่อ MySQL ได้
