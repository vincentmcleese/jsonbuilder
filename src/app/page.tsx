import dynamic from 'next/dynamic';

const HomePage = dynamic(() => import('@/components/HomePage'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function Page() {
  return <HomePage />;
}