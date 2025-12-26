const db = require("../db");

// ---------------------- REGISTER USER ---------------------- //
exports.registerUser = async (req, res) => {
    const {
        mobile,
        password,
        role,
        name,
        specialization,
        experience,
        email,
        age,
        gender,
        address
    } = req.body;

    try {
        const [loginResult] = await db.query(
            `INSERT INTO login (mobile, password, role) VALUES (?, ?, ?)`,
            [mobile, password, role]
        );

        const login_id = loginResult.insertId;

        if (role === "doctor") {
            await db.query(
                `INSERT INTO doctor (doctor_id, name, specialization, experience, email, mobile)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [login_id, name, specialization, experience, email, mobile]
            );

            return res.json({
                message: "Doctor registered successfully",
                login_id,
                role
            });

        } else if (role === "patient") {
            await db.query(
                `INSERT INTO patient (patient_id, name, age, gender, address, email, mobile)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [login_id, name, age, gender, address, email, mobile]
            );

            return res.json({
                message: "Patient registered successfully",
                login_id,
                role
            });
        }

    } catch (error) {
        console.error("Register Error:", error);
        return res.status(500).json({ error: "Registration failed", details: error });
    }
};

// ---------------------- LOGIN USER ---------------------- //
exports.loginUser = async (req, res) => {
    const { mobile, password } = req.body;
console.log(req.body);

    try {
        const [loginResult] = await db.query(
            `SELECT login_id, role, mobile FROM login WHERE mobile = ? AND password = ?`,
            [mobile, password]
        );

        if (loginResult.length === 0) {
            return res.status(400).json({ message: "Invalid mobile or password" });
        }

        const user = loginResult[0];

        const query =
            user.role === "doctor"
                ? `SELECT name FROM doctor WHERE doctor_id = ?`
                : `SELECT name FROM patient WHERE patient_id = ?`;

        const [profileResult] = await db.query(query, [user.login_id]);

        const name = profileResult.length > 0 ? profileResult[0].name : "";

        return res.json({
            message: "Login successful",
            login_id: user.login_id,
            role: user.role,
            name: name
        });

    } catch (error) {
        return res.status(500).json({ error: "Login failed", details: error });
    }
};
