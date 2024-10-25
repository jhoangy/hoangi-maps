import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically load the HereMap component to prevent issues with SSR
const HereMap = dynamic(() => import('../components/HereMap'), { ssr: false });

const Home: React.FC = () => {
  return (
    <div>
      <Head>
        <title>Hoangi Maps</title>
      </Head>
      <h1>Hoangi Maps</h1>
      <HereMap />
    </div>
  );
};

export default Home;
