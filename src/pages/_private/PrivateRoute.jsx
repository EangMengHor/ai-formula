import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useEffect, useState } from 'react';
import { useToast } from '../../hooks/use-toast';
import { useGetUserProfileStatus } from '../../hooks/use-get-user-profile-status';
import { Loader2 } from 'lucide-react';

export default function PrivateRoute() {
	const { hasPersonalProfile, loading } = useGetUserProfileStatus();
	const { user, setUser } = useUser();
	const navigate = useNavigate();
	const { toast } = useToast();
	const location = useLocation();
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!user.isAuthenticated) {
			localStorage.getItem('id') &&
				setUser({
					id: localStorage.getItem('id'),
					email: localStorage.getItem('email'),
					isAuthenticated: true,
				});
			toast({
				title: 'Access Not Allowed',
				description: 'You are not authenticated! Please login to continue',
				variant: 'default',
			});
			navigate('/login', { replace: true, state: { from: location } });
		}
	}, [user.isAuthenticated, navigate, location]);
	useEffect(() => {
		if (user.isAuthenticated) {
			console.log('user is authenticated', location.pathname);
			navigate(location.pathname);
		}
	}, [user.isAuthenticated]);

	useEffect(() => {
		if (!isMounted) return;
		if (!hasPersonalProfile && !loading) {
			navigate('/a', { replace: true });
		}
		if (hasPersonalProfile && !loading && location.pathname === '/a') {
			navigate('/', {
				replace: true,
			});
		}
	}, [hasPersonalProfile, navigate, loading, location.pathname]);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen bg-black">
				<Loader2 className="w-10 h-10 animate-spin text-white" />
			</div>
		);
	}

	return (
		<div>
			<Outlet />
		</div>
	);
}
