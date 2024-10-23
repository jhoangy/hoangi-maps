import dynamic from 'next/dynamic';
import Head from 'next/head';

// Dynamically load the HereMap component to prevent issues with SSR
const HereMap = dynamic(() => import('../components/HereMap'), { ssr: false });

const Home: React.FC = () => {
  return (
    <div>
      <Head>
        <title>Better Maps with HERE Routing API</title>
      </Head>
      <h1>Better Maps with HERE Routing</h1>
      <HereMap />
    </div>
  );
};

export default Home;
