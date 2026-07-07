import {
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { AssignedExam } from "../../models/exam-models";
import classes from "./exam-card.module.scss";
import TimelapseIcon from "@mui/icons-material/Timelapse";
import DateRangeIcon from "@mui/icons-material/DateRange";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import ReplayIcon from "@mui/icons-material/Replay";
import moment from "moment";
import { LoadingBarRef } from "react-top-loading-bar";

interface ExamCardProps {
  exam: AssignedExam;
  loadingBarRef: React.RefObject<LoadingBarRef>;
}

const statusColor = {
  pending: "default",
  submitted: "warning",
  graded: "success",
  completed: "success",
} as const;

const ExamCard: React.FC<ExamCardProps> = ({ exam, loadingBarRef }) => {
  const startDateFormatted = moment(exam.startDate).format("lll");
  const endDateFormatted = moment(exam.endDate).format("lll");
  const hasResults = (exam.attemptsUsed ?? 0) > 0;
  const canStart = (exam.attemptsRemaining ?? exam.maxAttempts ?? 1) > 0;
  const maxAttempts = exam.maxAttempts ?? 1;
  const attemptsRemaining = exam.attemptsRemaining ?? maxAttempts;

  return (
    <div>
      <Card
        sx={{
          boxShadow: "none",
          outline: "solid #eeeeee 2px",
        }}
      >
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography
              sx={{ fontSize: 14, marginBottom: "12px" }}
              color="text.secondary"
              gutterBottom
            >
              {exam?.name}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                size="small"
                label={exam.status}
                color={statusColor[exam.status] || "default"}
              />
              {hasResults && exam.gradeOutOf10 !== undefined && (
                <Chip
                  size="small"
                  label={`${exam.gradeOutOf10}/10`}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Stack>
          </Stack>

          <Typography
            sx={{ fontSize: 14, marginBottom: "12px" }}
            color="text.secondary"
            gutterBottom
          >
            ID: {exam?._id}
          </Typography>

          <Divider />

          <List>
            <ListItem>
              <ListItemIcon>
                <DateRangeIcon />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: "medium" }}>
                <span className={classes.examDateSpan}>{startDateFormatted}</span>
                <span className={classes.examDateSpan}>→</span>
                <span className={classes.examDateSpan}>{endDateFormatted}</span>
              </ListItemText>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <TimelapseIcon />
              </ListItemIcon>
              <ListItemText
                primary={`${exam.duration} Minutes`}
                primaryTypographyProps={{ fontSize: 14, fontWeight: "medium" }}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <FormatListNumberedIcon />
              </ListItemIcon>
              <ListItemText
                primary={`${exam.questionCount} Questions`}
                primaryTypographyProps={{ fontSize: 14, fontWeight: "medium" }}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <ReplayIcon />
              </ListItemIcon>
              <ListItemText
                primary={`${attemptsRemaining} of ${maxAttempts} attempt(s) remaining`}
                secondary={
                  hasResults
                    ? `Used ${exam.attemptsUsed} time(s)`
                    : "Not attempted yet"
                }
                primaryTypographyProps={{ fontSize: 14, fontWeight: "medium" }}
              />
            </ListItem>
          </List>
        </CardContent>
        <CardActions sx={{ flexWrap: "wrap", gap: 1 }}>
          {canStart && (
            <Link href={`/exam/${exam._id}`}>
              <Button
                size="small"
                variant="contained"
                color="primary"
                sx={{ ml: 2, mb: 1 }}
                onClick={() => loadingBarRef.current.continuousStart(50)}
              >
                {hasResults ? "Retake Exam" : "Start Exam"}
              </Button>
            </Link>
          )}
          {hasResults && (
            <Link href={`/exam/result/${exam._id}`}>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                sx={{ ml: canStart ? 0 : 2, mb: 1 }}
                onClick={() => loadingBarRef.current.continuousStart(50)}
              >
                View Results
              </Button>
            </Link>
          )}
        </CardActions>
      </Card>
    </div>
  );
};

export default ExamCard;
