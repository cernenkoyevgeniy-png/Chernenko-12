import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import SparkMark from '@/components/SparkMark';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Safety from '@/components/Safety';
import FAQ from '@/components/FAQ';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import Demo from '@/components/Demo';

import AuthScreen from '@/components/AuthScreen';
import ResetPasswordScreen from '@/components/ResetPasswordScreen';
import AppNav, { type Tab } from '@/components/AppNav';
import PeoplePage from '@/components/PeoplePage';
import MatchPage from '@/components/MatchPage';
import ChatsPage from '@/components/ChatsPage';
import GroupsPage from '@/components/GroupsPage';
import ProfilePage from '@/components/ProfilePage';

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink-950 text-white">
      <Header />
      <main>
        <Hero />
        <Demo />
        <Features />
        <HowItWorks />
        <Safety />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function AppShell() {
  const [tab, setTab] = useState<Tab>('match');
  const [chatWith, setChatWith] = useState<string | null>(null);
  const [showGroups, setShowGroups] = useState(false);

  const openChat = (userId: string) => {
    setChatWith(userId);
    setTab('chats');
  };

  return (
    <div className="relative min-h-screen bg-ink-950 text-white">
      <AppNav tab={tab} onChange={setTab} />
      <main className="pb-20 md:pb-0">
        {tab === 'match' && <MatchPage onOpenChat={openChat} />}
        {tab === 'people' && <PeoplePage onOpenChat={openChat} />}
        {tab === 'chats' && !showGroups && (
          <ChatsPage
            initialUserId={chatWith}
            onClearInitial={() => setChatWith(null)}
            onOpenGroups={() => setShowGroups(true)}
          />
        )}
        {tab === 'chats' && showGroups && <GroupsPage onBack={() => setShowGroups(false)} />}
        {tab === 'profile' && <ProfilePage />}
      </main>
    </div>
  );
}

function Gate() {
  const { session, profile, loading, recovery } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <div className="flex flex-col items-center gap-4">
          <SparkMark className="h-12 w-12" animate />
          <Loader2 className="h-5 w-5 animate-spin text-white/50" />
        </div>
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  // Восстановление пароля: сессия есть, но показываем форму нового пароля.
  if (recovery) return <ResetPasswordScreen />;

  // Сессия есть, но профиль мог не успеть создаться — покажем загрузку.
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <div className="flex flex-col items-center gap-4">
          <SparkMark className="h-12 w-12" animate />
          <Loader2 className="h-5 w-5 animate-spin text-white/50" />
        </div>
      </div>
    );
  }

  return <AppShell />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
