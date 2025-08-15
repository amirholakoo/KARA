import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Boards from "./Boards";

import RecurringTasks from "./RecurringTasks";

import Forms from "./Forms";

import FormEditor from "./FormEditor";

import FormSubmission from "./FormSubmission";

import FormPreview from "./FormPreview";

import Teams from "./Teams";

import CompleteProfile from "./CompleteProfile";

import NoTeamAssigned from "./NoTeamAssigned";

import AdminUsers from "./AdminUsers";

import Settings from "./Settings";

import Reports from "./Reports";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Boards: Boards,
    
    RecurringTasks: RecurringTasks,
    
    Forms: Forms,
    
    FormEditor: FormEditor,
    
    FormSubmission: FormSubmission,
    
    FormPreview: FormPreview,
    
    Teams: Teams,
    
    CompleteProfile: CompleteProfile,
    
    NoTeamAssigned: NoTeamAssigned,
    
    AdminUsers: AdminUsers,
    
    Settings: Settings,
    
    Reports: Reports,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Boards" element={<Boards />} />
                
                <Route path="/RecurringTasks" element={<RecurringTasks />} />
                
                <Route path="/Forms" element={<Forms />} />
                
                <Route path="/FormEditor" element={<FormEditor />} />
                
                <Route path="/FormSubmission" element={<FormSubmission />} />
                
                <Route path="/FormPreview" element={<FormPreview />} />
                
                <Route path="/Teams" element={<Teams />} />
                
                <Route path="/CompleteProfile" element={<CompleteProfile />} />
                
                <Route path="/NoTeamAssigned" element={<NoTeamAssigned />} />
                
                <Route path="/AdminUsers" element={<AdminUsers />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Reports" element={<Reports />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}