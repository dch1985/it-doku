export function ApiTest() {
  const testApi = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    console.log('API URL:', apiUrl);
    
    try {
      console.log('Testing Health...');
      const healthResponse = await fetch(`${apiUrl}/health`);
      const healthData = await healthResponse.json();
      console.log('✅ Health Check:', healthData);
      
      console.log('Testing Analyze API...');
      const analyzeResponse = await fetch(`${apiUrl}/api/analyze/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'test.js',
          code: 'console.log("test");'
        })
      });
      
      console.log('Analyze Status:', analyzeResponse.status);
      const analyzeData = await analyzeResponse.json();
      console.log('✅ Analyze Response:', analyzeData);
      
      alert('SUCCESS! Schau in die Console (F12)');
    } catch (error) {
      console.error('❌ ERROR:', error);
      alert('FEHLER! Schau in die Console (F12)');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl text-white mb-8">API Test</h1>
        <button
          onClick={testApi}
          className="px-8 py-4 bg-cyan-500 text-white text-xl font-bold rounded-xl hover:bg-cyan-600"
        >
          API TESTEN (Schau dann in Console F12)
        </button>
      </div>
    </div>
  );
}

export default ApiTest;