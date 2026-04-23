import {
	Navigate,
	Outlet,
	Route,
	BrowserRouter as Router,
	Routes,
} from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import AllFiles from "./pages/AllFiles/AllFiles.jsx";
import FileDetails from "./pages/FileDetails/FileDetails.jsx";
import Login from "./pages/Login/Login.jsx";
import ManageUsers from "./pages/ManageUsers/ManageUsers.jsx";
import Signup from "./pages/Signup/Signup.jsx";

const App = () => {
	return (
		<AuthProvider>
			<Router>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/signup" element={<Signup />} />

					<Route
						element={
							<ProtectedRoute>
								<Layout>
									<Outlet />
								</Layout>
							</ProtectedRoute>
						}>
						<Route path="/" element={<AllFiles />} />
						<Route path="/files" element={<AllFiles />} />
						<Route path="/file/:fileId" element={<FileDetails />} />
						<Route
							path="/manage-users"
							element={
								<ProtectedRoute allowedRoles={["admin"]}>
									<ManageUsers />
								</ProtectedRoute>
							}
						/>
					</Route>

					{/* Catch all route */}
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</Router>
		</AuthProvider>
	);
};

export default App;
