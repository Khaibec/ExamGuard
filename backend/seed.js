require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("./models/student");
const Exam = require("./models/exam");
const Admin = require("./models/admin");

const DB_URL = process.env.DB_URL;

mongoose
  .connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("DB Connected");

    try {
      await Student.deleteMany({});
      await Exam.deleteMany({});
      await Admin.deleteMany({});
      console.log("✅ Cleared existing data");

      const exams = [
        {
          _id: "exam001",
          name: "Math Test 1",
          startDate: "2026-05-10",
          endDate: "2026-05-15",
          duration: 60,
          shuffleQuestions: true,
          maxAttempts: 2,
          questions: [
            {
              title: "What is 2 + 2?",
              options: { a: "3", b: "4", c: "5", d: "6" },
            },
            {
              title: "What is the square root of 16?",
              options: { a: "2", b: "3", c: "4", d: "5" },
            },
            {
              title: "What is 10 × 5?",
              options: { a: "40", b: "50", c: "60", d: "70" },
            },
          ],
          questionCount: 3,
          answerKeys: ["b", "c", "b"],
        },
        {
          _id: "exam002",
          name: "English Test 1",
          startDate: "2026-05-12",
          endDate: "2026-08-17",
          duration: 45,
          shuffleQuestions: true,
          maxAttempts: 100,
          questions: [
            {
              title: "Which is the correct spelling?",
              options: {
                a: "occassion",
                b: "occasion",
                c: "ocasion",
                d: "occassoin",
              },
            },
            {
              title: "Choose the correct sentence:",
              options: {
                a: "She go to school",
                b: "She goes to school",
                c: "She going to school",
                d: "She gone to school",
              },
            },
            {
              title: "What is the antonym of 'happy'?",
              options: {
                a: "sad",
                b: "joyful",
                c: "cheerful",
                d: "delighted",
              },
            },
          ],
          questionCount: 3,
          answerKeys: ["b", "b", "a"],
        },
        {
          _id: "exam003",
          name: "Science Test 1",
          startDate: "2026-05-14",
          endDate: "2026-07-20",
          duration: 90,
          shuffleQuestions: false,
          maxAttempts: 6,
          questions: [
            {
              title: "What is the chemical formula for water?",
              options: { a: "H2O", b: "O2H", c: "H2O2", d: "OH2" },
            },
            {
              title: "How many planets are in our solar system?",
              options: { a: "7", b: "8", c: "9", d: "10" },
            },
            {
              title: "What is the speed of light?",
              options: {
                a: "300,000 km/s",
                b: "150,000 km/s",
                c: "500,000 km/s",
                d: "100,000 km/s",
              },
            },
          ],
          questionCount: 3,
          answerKeys: ["a", "b", "a"],
        },
      ];

      const students = [
        {
          _id: "student001",
          fname: "Khải",
          lname: "Phùng",
          password: "studend123",
          assignedExams: [
            { examId: "exam001", status: "pending" },
            { examId: "exam002", status: "pending" },
          ],
          submittedExams: {},
        },
        {
          _id: "student002",
          fname: "Ngọc",
          lname: "Trần",
          password: "studend123",
          assignedExams: [
            { examId: "exam002", status: "completed" },
            { examId: "exam003", status: "pending" },
          ],
          submittedExams: {
            exam002: {
              attempts: [
                {
                  answers: ["b", "b", "a"],
                  questionOrder: [0, 1, 2],
                  score: 3,
                  total: 3,
                  percentage: 100,
                  gradeOutOf10: 10,
                  submittedAt: "2026-05-13T10:00:00.000Z",
                  attemptNumber: 1,
                  breakdown: [
                {
                  displayIndex: 0,
                  originalIndex: 0,
                  questionTitle: "Which is the correct spelling?",
                  studentAnswer: "b",
                  correctAnswer: "b",
                  isCorrect: true,
                },
                {
                  displayIndex: 1,
                  originalIndex: 1,
                  questionTitle: "Choose the correct sentence:",
                  studentAnswer: "b",
                  correctAnswer: "b",
                  isCorrect: true,
                },
                {
                  displayIndex: 2,
                  originalIndex: 2,
                  questionTitle: "What is the antonym of 'happy'?",
                  studentAnswer: "a",
                  correctAnswer: "a",
                  isCorrect: true,
                },
              ],
                },
              ],
            },
          },
        },
        {
          _id: "student003",
          fname: "Minh",
          lname: "Lê",
          password: "studend123",
          assignedExams: [
            { examId: "exam001", status: "graded" },
            { examId: "exam003", status: "pending" },
          ],
          submittedExams: {
            exam001: {
              attempts: [
                {
                  answers: ["b", "a", "b"],
                  questionOrder: [1, 0, 2],
                  score: 1,
                  total: 3,
                  percentage: 33,
                  gradeOutOf10: 3.3,
                  submittedAt: "2026-05-11T14:30:00.000Z",
                  attemptNumber: 1,
                  breakdown: [
                {
                  displayIndex: 0,
                  originalIndex: 1,
                  questionTitle: "What is the square root of 16?",
                  studentAnswer: "b",
                  correctAnswer: "c",
                  isCorrect: false,
                },
                {
                  displayIndex: 1,
                  originalIndex: 0,
                  questionTitle: "What is 2 + 2?",
                  studentAnswer: "a",
                  correctAnswer: "b",
                  isCorrect: false,
                },
                {
                  displayIndex: 2,
                  originalIndex: 2,
                  questionTitle: "What is 10 × 5?",
                  studentAnswer: "b",
                  correctAnswer: "b",
                  isCorrect: true,
                },
              ],
                },
              ],
            },
          },
        },
      ];

      const admins = [
        {
          _id: "admin001",
          fname: "Lan",
          lname: "Nguyễn",
          password: "admin12345",
          managedStudents: ["1234567890", "1234567891"],
        },
        {
          _id: "admin002",
          fname: "Hùng",
          lname: "Trần",
          password: "admin12345",
          managedStudents: ["0123456789"],
        },
      ];

      await Exam.insertMany(exams);
      console.log("✅ Exams seeded successfully!");

      await Student.insertMany(students);
      console.log("✅ Students seeded successfully!");

      await Admin.insertMany(admins);
      console.log("✅ Admins seeded successfully!");

      console.log("\n📊 Seeded Data Summary:");
      console.log(`   - Exams: ${exams.length}`);
      console.log(`   - Students: ${students.length}`);
      console.log(`   - Instructors: ${admins.length}`);
      console.log("\n🔑 Test Credentials:");
      console.log("   Students:");
      students.forEach((s) => {
        console.log(`   - ID: ${s._id}, Password: ${s.password}`);
      });
      console.log("   Instructors:");
      admins.forEach((a) => {
        console.log(
          `   - ID: ${a._id}, Password: ${a.password}, Students: ${a.managedStudents.join(", ")}`
        );
      });

      process.exit(0);
    } catch (err) {
      console.log("❌ Error:", err.message);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.log("❌ DB Connection Error:", err.message);
    process.exit(1);
  });
