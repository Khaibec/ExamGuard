const { handleError } = require("../utils/handleResponse");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const Student = require("../models/student");
const Exam = require("../models/exam");
const {
  getSubmissionRecord,
  getAttemptSummary,
  getBestAttempt,
  getAutoGradeOutOf10,
  getFinalGradeOutOf10,
} = require("../utils/grading");
const CheatingLog = require("../models/cheating_log");

exports.getAdminByID = (req, res, next, id) => {
  Admin.findById(id, (err, admin) => {
    if (err || !admin) return handleError(res, "Admin not found!", 400);
    req.admin = admin;
    next();
  });
};

exports.loadAdmin = (req, res, next) => {
  Admin.findById(req.auth.id, (err, admin) => {
    if (err || !admin) return handleError(res, "Admin not found!", 400);
    req.admin = admin;
    next();
  });
};

exports.ensureManagedStudent = (req, res, next) => {
  const managedStudents = req.admin.managedStudents || [];

  if (!managedStudents.includes(req.student._id)) {
    return handleError(res, "Access denied, student not in your class!", 403);
  }

  next();
};

exports.login = (req, res) => {
  const { id, password } = req.body;

  if (!id || !password) {
    return handleError(res, "ID and password are required!", 400);
  }

  Admin.findById(id, (err, admin) => {
    if (err) return handleError(res, "Database error, please try again!", 400);

    if (!admin) return handleError(res, "Admin does not exist!", 400);

    if (!admin.authenticate(password))
      return handleError(res, "Incorrect username or password!", 401);

    const { _id, fname, lname } = admin;

    const token = jwt.sign(
      { id: _id, role: "admin" },
      process.env.JWT_SECRET,
      { algorithm: "HS256" }
    );

    return res.json({ id: _id, fname, lname, role: "admin", token });
  });
};

const sanitizeStudent = ({ _id, fname, lname, assignedExams, submittedExams }) => {
  const submissions = Object.entries(submittedExams || {}).flatMap(
    ([examId, rawSubmission]) => {
      const { attempts } = getSubmissionRecord(rawSubmission);

      return attempts.map((attempt) => ({
        examId,
        attemptNumber: attempt.attemptNumber,
        score: attempt.score,
        total: attempt.total,
        percentage: attempt.percentage,
        gradeOutOf10: attempt.gradeOutOf10,
        autoGradeOutOf10: getAutoGradeOutOf10(rawSubmission),
        finalGradeOutOf10: getFinalGradeOutOf10(rawSubmission),
        submittedAt: attempt.submittedAt,
      }));
    }
  );

  return {
    _id,
    fname,
    lname,
    assignedExams,
    submissions,
  };
};

exports.getAllStudents = (req, res) => {
  const managedStudents = req.admin.managedStudents || [];

  Student.find({ _id: { $in: managedStudents } }, (err, students) => {
    if (err) return handleError(res, "Database error, please try again!", 400);

    return res.json({
      students: students.map(sanitizeStudent),
    });
  });
};

exports.getStudent = (req, res) => {
  return res.json(sanitizeStudent(req.student));
};

exports.createStudent = (req, res) => {
  const { _id, fname, lname, password, assignedExams } = req.body;

  if (!_id || !fname || !password) {
    return handleError(res, "ID, first name, and password are required!", 400);
  }

  const student = new Student({
    _id,
    fname,
    lname,
    password,
    assignedExams: assignedExams || [],
    submittedExams: {},
  });

  student.save((err, savedStudent) => {
    if (err) return handleError(res, "Error creating student!", 400);

    const admin = req.admin;
    if (!admin.managedStudents.includes(savedStudent._id)) {
      admin.managedStudents.push(savedStudent._id);
    }

    admin.save((adminErr) => {
      if (adminErr) return handleError(res, "Error linking student to instructor!", 400);

      return res.json(sanitizeStudent(savedStudent));
    });
  });
};

exports.updateStudent = (req, res) => {
  const { fname, lname, password, assignedExams } = req.body;
  const student = req.student;

  if (fname !== undefined) student.fname = fname;
  if (lname !== undefined) student.lname = lname;
  if (password !== undefined) student.password = password;
  if (assignedExams !== undefined) student.assignedExams = assignedExams;

  student.save((err, updatedStudent) => {
    if (err) return handleError(res, "Error updating student!", 400);

    return res.json(sanitizeStudent(updatedStudent));
  });
};

exports.deleteStudent = (req, res) => {
  const studentId = req.student._id;

  req.student.deleteOne((err) => {
    if (err) return handleError(res, "Error deleting student!", 400);

    Admin.findById(req.admin._id, (adminErr, admin) => {
      if (adminErr || !admin) {
        return res.json({ msg: "Student deleted successfully!" });
      }

      admin.managedStudents = admin.managedStudents.filter(
        (id) => id !== studentId
      );

      admin.save(() => {
        return res.json({ msg: "Student deleted successfully!" });
      });
    });
  });
};

exports.getAllExams = (req, res) => {
  Exam.find({}, (err, exams) => {
    if (err) return handleError(res, "Database error, please try again!", 400);

    return res.json({ exams });
  });
};

exports.getExam = (req, res) => {
  return res.json(req.exam);
};

exports.createExam = (req, res) => {
  const exam = new Exam({ ...req.body });

  exam.save((err, savedExam) => {
    if (err) return handleError(res, "Error creating exam!", 400);

    return res.json(savedExam);
  });
};

exports.updateExam = (req, res) => {
  const exam = req.exam;
  const {
    name,
    startDate,
    endDate,
    duration,
    questions,
    questionCount,
    answerKeys,
    shuffleQuestions,
    maxAttempts,
  } = req.body;

  if (name !== undefined) exam.name = name;
  if (startDate !== undefined) exam.startDate = startDate;
  if (endDate !== undefined) exam.endDate = endDate;
  if (duration !== undefined) exam.duration = duration;
  if (questions !== undefined) exam.questions = questions;
  if (questionCount !== undefined) exam.questionCount = questionCount;
  if (answerKeys !== undefined) exam.answerKeys = answerKeys;
  if (shuffleQuestions !== undefined) exam.shuffleQuestions = shuffleQuestions;
  if (maxAttempts !== undefined) exam.maxAttempts = maxAttempts;

  exam.save((err, updatedExam) => {
    if (err) return handleError(res, "Error updating exam!", 400);

    return res.json(updatedExam);
  });
};

exports.deleteExam = (req, res) => {
  req.exam.deleteOne((err) => {
    if (err) return handleError(res, "Error deleting exam!", 400);

    return res.json({ msg: "Exam deleted successfully!" });
  });
};

exports.getStats = (req, res) => {
  const managedStudents = req.admin.managedStudents || [];

  Student.find({ _id: { $in: managedStudents } }, (err, students) => {
    if (err) return handleError(res, "Database error, please try again!", 400);

    const submissions = [];
    const examStatsMap = {};
    let totalScore = 0;
    let totalPossible = 0;

    students.forEach((student) => {
      Object.entries(student.submittedExams || {}).forEach(
        ([examId, rawSubmission]) => {
          const { attempts } = getSubmissionRecord(rawSubmission);

          attempts.forEach((attempt) => {
            if (attempt.score === null || attempt.score === undefined) {
              return;
            }

            submissions.push({
              studentId: student._id,
              studentName: `${student.fname} ${student.lname}`.trim(),
              examId,
              attemptNumber: attempt.attemptNumber,
              score: attempt.score,
              total: attempt.total,
              percentage: attempt.percentage,
              gradeOutOf10: attempt.gradeOutOf10,
              autoGradeOutOf10: getAutoGradeOutOf10(rawSubmission),
              finalGradeOutOf10: getFinalGradeOutOf10(rawSubmission),
              submittedAt: attempt.submittedAt,
            });

            totalScore += attempt.score;
            totalPossible += attempt.total;

            if (!examStatsMap[examId]) {
              examStatsMap[examId] = {
                examId,
                submissionCount: 0,
                totalScore: 0,
                totalPossible: 0,
              };
            }

            examStatsMap[examId].submissionCount += 1;
            examStatsMap[examId].totalScore += attempt.score;
            examStatsMap[examId].totalPossible += attempt.total;
          });
        }
      );
    });

    Exam.find({}, (examErr, exams) => {
      if (examErr) return handleError(res, "Database error, please try again!", 400);

      const examNameMap = exams.reduce((acc, exam) => {
        acc[exam._id] = exam.name;
        return acc;
      }, {});

      const examStats = Object.values(examStatsMap).map((stat) => ({
        examId: stat.examId,
        examName: examNameMap[stat.examId] || stat.examId,
        submissionCount: stat.submissionCount,
        averagePercentage:
          stat.totalPossible > 0
            ? Math.round((stat.totalScore / stat.totalPossible) * 100)
            : 0,
      }));

      submissions.sort(
        (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
      );

      return res.json({
        managedStudentsCount: students.length,
        totalSubmissions: submissions.length,
        averagePercentage:
          totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0,
        examStats,
        submissions: submissions.map((item) => ({
          ...item,
          examName: examNameMap[item.examId] || item.examId,
        })),
      });
    });
  });
};

const CHEATING_TYPE_LABELS = {
  looking_left: "Looking left",
  looking_right: "Looking right",
  no_face_detected: "Face not detected",
  multiple_faces: "Multiple faces",
  tab_switch: "Tab switch",
};

exports.getExamReview = (req, res) => {
  const examId = req.exam._id;
  const record = getSubmissionRecord(req.student.submittedExams?.[examId]);
  const bestAttempt = getBestAttempt(record);
  const summary = getAttemptSummary(record, req.exam.maxAttempts || 1);

  if (!bestAttempt) {
    return handleError(res, "No submission found for this exam!", 404);
  }

  CheatingLog.find({ studentId: req.student._id, examId })
    .sort({ createdAt: -1 })
    .exec((err, logs) => {
      if (err) return handleError(res, "Database error, please try again!", 400);

      const cheatingByType = {};

      logs.forEach((log) => {
        if (!cheatingByType[log.cheatingType]) {
          cheatingByType[log.cheatingType] = {
            cheatingType: log.cheatingType,
            label: CHEATING_TYPE_LABELS[log.cheatingType] || log.cheatingType,
            count: 0,
            logs: [],
          };
        }

        cheatingByType[log.cheatingType].count += 1;
        cheatingByType[log.cheatingType].logs.push({
          id: log._id,
          imageUrl: log.imageUrl,
          createdAt: log.createdAt,
          attemptNumber: log.attemptNumber ?? null,
        });
      });

      return res.json({
        student: {
          _id: req.student._id,
          fname: req.student.fname,
          lname: req.student.lname,
        },
        exam: {
          _id: req.exam._id,
          name: req.exam.name,
        },
        submission: {
          bestAttempt,
          attempts: record.attempts,
          autoGradeOutOf10: summary.autoGradeOutOf10,
          finalGradeOutOf10: summary.finalGradeOutOf10,
          adjustedGradeOutOf10: record.adjustedGradeOutOf10,
          reviewNote: record.reviewNote,
          reviewedAt: record.reviewedAt,
          reviewedBy: record.reviewedBy,
        },
        cheatingSummary: Object.values(cheatingByType),
        totalCheatingEvents: logs.length,
      });
    });
};

exports.updateExamGrade = (req, res) => {
  const examId = req.exam._id;
  const { adjustedGradeOutOf10, reviewNote } = req.body;

  if (
    adjustedGradeOutOf10 === undefined ||
    adjustedGradeOutOf10 === null ||
    adjustedGradeOutOf10 === ""
  ) {
    return handleError(res, "adjustedGradeOutOf10 is required!", 400);
  }

  const grade = Number(adjustedGradeOutOf10);

  if (Number.isNaN(grade) || grade < 0 || grade > 10) {
    return handleError(res, "Grade must be between 0 and 10!", 400);
  }

  const record = getSubmissionRecord(req.student.submittedExams?.[examId]);

  if (!record.attempts.length) {
    return handleError(res, "No submission found for this exam!", 404);
  }

  record.adjustedGradeOutOf10 = Math.round(grade * 10) / 10;
  record.reviewNote = reviewNote || null;
  record.reviewedAt = new Date().toISOString();
  record.reviewedBy = req.admin._id;

  req.student.submittedExams[examId] = record;
  req.student.markModified("submittedExams");

  req.student.save((saveErr) => {
    if (saveErr) return handleError(res, "Error updating grade!", 400);

    return res.json({
      examId,
      autoGradeOutOf10: getAutoGradeOutOf10(record),
      adjustedGradeOutOf10: record.adjustedGradeOutOf10,
      finalGradeOutOf10: getFinalGradeOutOf10(record),
      reviewNote: record.reviewNote,
      reviewedAt: record.reviewedAt,
      reviewedBy: record.reviewedBy,
    });
  });
};
