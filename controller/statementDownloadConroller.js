const PDFDocument = require("pdfkit");
const pool = require("../dboperations");

exports.downloadStatement = async (req, res) => {
  const { user_id } = req.params;

  try {
    const [[user]] = await pool.query(
      `SELECT FirstName, LastName, account_number, TotalAmount
       FROM user_register WHERE user_id = ?`,
      [user_id]
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [transactions] = await pool.query(
      `SELECT date, type, amount, recipient, category
       FROM transactions
       WHERE user_id = ?
       ORDER BY date ASC`,
      [user_id]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ message: "No transactions found" });
    }

    let net = 0;
    transactions.forEach(tx => {
      net += tx.type === "credit"
        ? Number(tx.amount)
        : -Number(tx.amount);
    });

    const closingBalance = Number(user.TotalAmount);
    const openingBalance = closingBalance - net;

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=bank_statement.pdf"
    );

    doc.pipe(res);
    doc.fontSize(20).text("HIKINGIT BANK", { align: "center" });
    doc.fontSize(11).text("Account Statement", { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(11);
    doc.text(`Account Holder : ${user.FirstName} ${user.LastName}`);
    doc.text(`Account Number : ${user.account_number}`);
    doc.text(`Statement Date : ${new Date().toLocaleDateString()}`);
    doc.moveDown(1.5);

    const col = {
      date: 40,
      desc: 120,
      credit: 330,
      debit: 410,
      balance: 500
    };

    let y = doc.y;

    doc.fontSize(10)
      .text("Date", col.date, y)
      .text("Description", col.desc, y)
      .text("Credit", col.credit, y, { width: 60, align: "right" })
      .text("Debit", col.debit, y, { width: 60, align: "right" })
      .text("Remaining Balance", col.balance - 40, y, {
        width: 110,
        align: "right"
      });

    doc.moveTo(40, y + 15).lineTo(555, y + 15).stroke();
    y += 25;

    let runningBalance = openingBalance;

    transactions.forEach(tx => {
      const shortDate = new Date(tx.date).toLocaleDateString("en-GB");

      const amount = Number(tx.amount);
      const credit = tx.type === "credit" ? amount.toFixed(2) : "";
      const debit = tx.type === "debit" ? amount.toFixed(2) : "";

      runningBalance += tx.type === "credit"
        ? amount
        : -amount;

      doc.fontSize(10)
        .text(shortDate, col.date, y)
        .text(`${tx.recipient} (${tx.category})`, col.desc, y, { width: 190 })
        .text(credit, col.credit, y, { width: 60, align: "right" })
        .text(debit, col.debit, y, { width: 60, align: "right" })
        .text(`${runningBalance.toFixed(2)}`, col.balance, y, {
          width: 70,
          align: "right"
        });

      y += 22;

      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });
  const signature=[
    'koteswararao',
  ]
    doc.fontSize(9).text("Signature : "+signature);
    doc.moveDown(2);
   
    doc.end();

  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate statement" });
    }
  }
};




// const PDFDocument = require("pdfkit");
// const pool = require("../dboperations");

// exports.downloadStatement = async (req, res) => {
//   const { user_id } = req.params;

//   const { days, months, year } = req.query;

//   try {
//     // ---------------- USER DETAILS ----------------
//     const [[user]] = await pool.query(
//       `SELECT FirstName, LastName, account_number, TotalAmount
//        FROM user_register WHERE user_id = ?`,
//       [user_id]
//     );

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // ---------------- DATE RANGE (DYNAMIC) ----------------
//     const toDate = new Date();
//     const fromDate = new Date();

//     if (days) {
//       fromDate.setDate(toDate.getDate() - Number(days));
//     } else if (months) {
//       fromDate.setMonth(toDate.getMonth() - Number(months));
//     } else if (year) {
//       fromDate.setFullYear(toDate.getFullYear() - Number(year));
//     } else {
//       // default → last 1 month
//       fromDate.setMonth(toDate.getMonth() - 1);
//     }

//     // ---------------- FETCH TRANSACTIONS ----------------
//     const [transactions] = await pool.query(
//       `SELECT date, type, amount, recipient, category
//        FROM transactions
//        WHERE user_id = ?
//          AND date BETWEEN ? AND ?
//        ORDER BY date ASC`,
//       [user_id, fromDate, toDate]
//     );

//     if (transactions.length === 0) {
//       return res.status(404).json({
//         message: "No transactions found for selected period"
//       });
//     }

//     // ---------------- OPENING BALANCE ----------------
//     let net = 0;
//     transactions.forEach(tx => {
//       net += tx.type === "credit"
//         ? Number(tx.amount)
//         : -Number(tx.amount);
//     });

//     const closingBalance = Number(user.TotalAmount);
//     const openingBalance = closingBalance - net;

//     // ---------------- PDF SETUP ----------------
//     const doc = new PDFDocument({ size: "A4", margin: 40 });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=bank_statement.pdf"
//     );

//     doc.pipe(res);

//     // ---------------- HEADER ----------------
//     doc.fontSize(20).text("HIKINGIT BANK", { align: "center" });
//     doc.fontSize(11).text("Account Statement", { align: "center" });
//     doc.moveDown(1.5);

//     doc.fontSize(11);
//     doc.text(`Account Holder : ${user.FirstName} ${user.LastName}`);
//     doc.text(`Account Number : ${user.account_number}`);
//     doc.text(
//       `Statement Period : ${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`
//     );
//     doc.text(`Generated On : ${new Date().toLocaleDateString()}`);
//     doc.moveDown(1.5);

//     doc.text(`Opening Balance : ₹ ${openingBalance.toFixed(2)}`);
//     doc.moveDown(1);

//     // ---------------- TABLE HEADER ----------------
//     const col = {
//       date: 40,
//       desc: 120,
//       credit: 330,
//       debit: 410,
//       balance: 500
//     };

//     let y = doc.y;

//     doc.fontSize(10)
//       .text("Date", col.date, y)
//       .text("Description", col.desc, y)
//       .text("Credit", col.credit, y, { width: 60, align: "right" })
//       .text("Debit", col.debit, y, { width: 60, align: "right" })
//       .text("Balance", col.balance - 30, y, { width: 90, align: "right" });

//     doc.moveTo(40, y + 15).lineTo(555, y + 15).stroke();
//     y += 25;

//     // ---------------- TRANSACTIONS ----------------
//     let runningBalance = openingBalance;

//     transactions.forEach(tx => {
//       const shortDate = new Date(tx.date).toLocaleDateString("en-GB");
//       const amount = Number(tx.amount);

//       const credit = tx.type === "credit" ? amount.toFixed(2) : "";
//       const debit = tx.type === "debit" ? amount.toFixed(2) : "";

//       runningBalance += tx.type === "credit"
//         ? amount
//         : -amount;

//       doc.fontSize(10)
//         .text(shortDate, col.date, y)
//         .text(`${tx.recipient} (${tx.category})`, col.desc, y, { width: 190 })
//         .text(credit, col.credit, y, { width: 60, align: "right" })
//         .text(debit, col.debit, y, { width: 60, align: "right" })
//         .text(runningBalance.toFixed(2), col.balance, y, {
//           width: 70,
//           align: "right"
//         });

//       y += 22;

//       if (y > 750) {
//         doc.addPage();
//         y = 50;
//       }
//     });

//     // ---------------- FOOTER ----------------
//     doc.moveDown(2);
//     doc.fontSize(9).text("Authorized Signature");
//     doc.text("Koteswararao");

//     doc.end();

//   } catch (error) {
//     console.error(error);
//     if (!res.headersSent) {
//       res.status(500).json({ message: "Failed to generate statement" });
//     }
//   }
// };
