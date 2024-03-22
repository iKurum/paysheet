import { Navigate } from "react-router-dom";
import HomePage from "../page/HomePage";
import NotFound from "../page/NotFound";
import ProjectsPage from "../page/all/ProjectsPage";
import UsersPage from "../page/all/UsersPage";
import AttendancePage from "../page/AttendancePage";
import PaySheetPage from "../page/PaySheetPage";

export default [
  {
    path: "home",
    element: <Navigate to="/" />,
  },
  {
    path: "projects",
    element: <ProjectsPage />,
  },
  {
    path: "users",
    element: <UsersPage />,
  },
  {
    path: "attendance",
    element: <AttendancePage />,
  },
  {
    path: "paysheet",
    element: <PaySheetPage />,
  },
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];
