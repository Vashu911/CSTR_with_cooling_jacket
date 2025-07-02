import React, { useState, useEffect, useRef } from 'react';
import { Activity, Beaker, Settings, TrendingUp, Thermometer, Droplets, BookOpen, Play, Pause, RotateCcw, AlertTriangle, Menu, X } from 'lucide-react';
import { CSTRSimulator, CSTRState, CSTRParameters } from './utils/cstrModel';
import { AssumptionsModal } from './components/AssumptionsModal';

interface ParameterHistory {
  volume: number[];
  concentration: number[];
  temperature: number[];
  jacketTemp: number[];
  time: number[];
  conversion: number[];
  reactionRate: number[];
  outletFlow: number[];
}

function App() {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // CSTR Parameters (based on MATLAB reference)
  const [cstrParams, setCstrParams] = useState<CSTRParameters>({
    inletFlowRate: 1.0,           // m³/s (F0)
    feedConcentration: 0.5,       // mol/m³ (CA0)
    feedTemperature: 350,         // K (T0)
    jacketInletTemp: 300,         // K (TJ0)
    valveConstant: 0.1,           // m³/(s·m³) (KV)
    minimumVolume: 0.1,           // m³ (Vmin)
    preExponentialFactor: 1,      // 1/s (alpha)
    activationEnergy: 10000,      // J/mol (E)
    gasConstant: 8.314,           // J/(mol·K) (R)
    reactionOrder: 2,             // dimensionless (n)
    density: 1000,                // kg/m³ (rho)
    heatCapacity: 4.18,           // J/(kg·K) (Cp)
    heatOfReaction: 1,            // J/mol (lambda)
    heatTransferCoeff: 100,       // W/(m²·K) (U)
    heatTransferArea: 1,          // m² (AH)
    jacketDensity: 1000,          // kg/m³ (rhoJ)
    jacketHeatCapacity: 4.18,     // J/(kg·K) (CJ)
    jacketVolume: 0.1,            // m³ (VJ)
    jacketFlowRate: 0.1           // m³/s (FJ)
  });

  // Initial state (based on MATLAB reference)
  const initialState: CSTRState = {
    volume: 1.0,        // m³ (V0)
    concentration: 0.5, // mol/m³ (CA0)
    temperature: 350,   // K (T0)
    jacketTemp: 300,    // K (TJ0)
    time: 0             // s
  };

  const [currentState, setCurrentState] = useState<CSTRState>(initialState);
  const [history, setHistory] = useState<ParameterHistory>({
    volume: [1.0],
    concentration: [0.5],
    temperature: [350],
    jacketTemp: [300],
    time: [0],
    conversion: [0],
    reactionRate: [0],
    outletFlow: [0]
  });

  const simulatorRef = useRef<CSTRSimulator | null>(null);

  // Initialize simulator
  useEffect(() => {
    simulatorRef.current = new CSTRSimulator(initialState, cstrParams);
  }, []);

  // Update simulator parameters when controls change
  useEffect(() => {
    if (simulatorRef.current) {
      simulatorRef.current.updateParameters(cstrParams);
    }
  }, [cstrParams]);

  // Simulation loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && simulatorRef.current) {
      interval = setInterval(() => {
        // Run multiple steps for faster simulation
        for (let i = 0; i < simulationSpeed; i++) {
          const newState = simulatorRef.current!.step();
          setCurrentState(newState);
          
          // Update history (keep last 50 points)
          setHistory(prev => {
            const maxPoints = 50;
            const conversion = simulatorRef.current!.getConversion();
            const reactionRate = simulatorRef.current!.getReactionRate();
            const outletFlow = simulatorRef.current!.getOutletFlow();
            
            return {
              volume: [...prev.volume.slice(-maxPoints + 1), newState.volume],
              concentration: [...prev.concentration.slice(-maxPoints + 1), newState.concentration],
              temperature: [...prev.temperature.slice(-maxPoints + 1), newState.temperature],
              jacketTemp: [...prev.jacketTemp.slice(-maxPoints + 1), newState.jacketTemp],
              time: [...prev.time.slice(-maxPoints + 1), newState.time],
              conversion: [...prev.conversion.slice(-maxPoints + 1), conversion],
              reactionRate: [...prev.reactionRate.slice(-maxPoints + 1), reactionRate],
              outletFlow: [...prev.outletFlow.slice(-maxPoints + 1), outletFlow]
            };
          });
        }
      }, 100); // Update every 100ms
    }
    return () => clearInterval(interval);
  }, [isRunning, simulationSpeed]);

  const resetSimulation = () => {
    setIsRunning(false);
    setCurrentState(initialState);
    setHistory({
      volume: [1.0],
      concentration: [0.5],
      temperature: [350],
      jacketTemp: [300],
      time: [0],
      conversion: [0],
      reactionRate: [0],
      outletFlow: [0]
    });
    simulatorRef.current = new CSTRSimulator(initialState, cstrParams);
    setIsMobileMenuOpen(false);
  };

  const handleParameterChange = (key: keyof CSTRParameters, value: number) => {
    setCstrParams(prev => ({ ...prev, [key]: value }));
  };

  // Safety checks
  const getSafetyStatus = () => {
    const tempHigh = currentState.temperature > 400; // K
    const tempLow = currentState.temperature < 280; // K
    const concHigh = currentState.concentration > 2.0; // mol/m³
    const volumeLow = currentState.volume < 0.2; // m³
    const conversionLow = simulatorRef.current ? simulatorRef.current.getConversion() < 30 : false;

    return {
      temperature: tempHigh ? 'danger' : tempLow ? 'warning' : 'normal',
      concentration: concHigh ? 'warning' : 'normal',
      volume: volumeLow ? 'warning' : 'normal',
      conversion: conversionLow ? 'warning' : 'normal'
    };
  };

  const safetyStatus = getSafetyStatus();

  const MiniGraph = ({ title, data, color, unit, min, max }: { 
    title: string; 
    data: number[]; 
    color: string; 
    unit: string;
    min?: number;
    max?: number;
  }) => {
    const dataMin = min ?? Math.min(...data);
    const dataMax = max ?? Math.max(...data);
    const range = dataMax - dataMin || 1;

    return (
      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md border border-gray-200">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">{title}</h3>
        <div className="h-16 sm:h-20 relative">
          <svg className="w-full h-full" viewBox="0 0 100 50">
            <defs>
              <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={color} stopOpacity="0.1"/>
              </linearGradient>
            </defs>
            {data.length > 1 && (
              <>
                <polyline
                  fill={`url(#gradient-${color.replace('#', '')})`}
                  stroke={color}
                  strokeWidth="2"
                  points={data.map((val, i) => 
                    `${(i / (data.length - 1)) * 100},${50 - ((val - dataMin) / range) * 30}`
                  ).join(' ') + ` 100,50 0,50`}
                />
                <polyline
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  points={data.map((val, i) => 
                    `${(i / (data.length - 1)) * 100},${50 - ((val - dataMin) / range) * 30}`
                  ).join(' ')}
                />
              </>
            )}
          </svg>
        </div>
        <div className="text-xs text-gray-500 mt-1 sm:mt-2">
          Current: {data[data.length - 1]?.toFixed(3)} {unit}
        </div>
      </div>
    );
  };

  const ControlSlider = ({ label, value, onChange, min = 0, max = 1, step = 0.1, unit = "" }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
  }) => (
    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-0">{label}</label>
        <span className="text-xs sm:text-sm font-semibold text-blue-600">{value.toFixed(3)} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Beaker className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">SIM4STU</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setShowAssumptions(true)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Model Info</span>
              </button>
              <button 
                onClick={resetSimulation}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button 
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isRunning 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? 'Pause' : 'Start'}</span>
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation Dropdown */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-3">
              <button
                onClick={() => {
                  setShowAssumptions(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 w-full px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Model Info</span>
              </button>
              <button 
                onClick={resetSimulation}
                className="flex items-center space-x-2 w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button 
                onClick={() => {
                  setIsRunning(!isRunning);
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center space-x-2 w-full px-3 py-2 rounded-lg font-medium transition-colors ${
                  isRunning 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? 'Pause' : 'Start'}</span>
              </button>
            </div>
          )}
        </div> 
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Title Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Variable Volume CSTR Simulation</h1>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Speed:</label>
                <select 
                  value={simulationSpeed} 
                  onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={5}>5x</option>
                  <option value={10}>10x</option>
                </select>
              </div>
              <div className="text-sm text-gray-600">
                Time: {currentState.time.toFixed(1)} s
              </div>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Advanced CSTR simulation with variable volume, nth-order kinetics, and dynamic jacket cooling. 
            Based on rigorous mass and energy balances with Arrhenius temperature dependence.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Reactor Diagram and Controls */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Reactor Diagram */}
            <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-200">
              <div className="relative">
                {/* Feed Input */}
                <div className="absolute top-2 sm:top-4 left-2 sm:left-8 flex items-center">
                  <div className="bg-blue-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                    Feed: {cstrParams.inletFlowRate.toFixed(2)} m³/s
                  </div>
                  <div className="w-8 sm:w-16 h-0.5 bg-blue-500 ml-1 sm:ml-2"></div>
                </div>

                {/* Coolant Inlet */}
                <div className="absolute top-8 sm:top-16 right-2 sm:right-8 flex items-center">
                  <div className="w-8 sm:w-16 h-0.5 bg-cyan-500 mr-1 sm:mr-2"></div>
                  <div className="bg-cyan-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                    Coolant: {cstrParams.jacketInletTemp.toFixed(0)} K
                  </div>
                </div>

                {/* Main Reactor */}
                <div className="flex justify-center items-center h-60 sm:h-80">
                  <div className="relative">
                    {/* Reactor Vessel - Variable height based on volume */}
                    <div 
                      className="w-32 sm:w-48 bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg border-2 sm:border-4 border-gray-400 relative overflow-hidden transition-all duration-500"
                      style={{ height: `${Math.max(150, 150 + (currentState.volume - 1) * 30)}px` }}
                    >
                      {/* Liquid Level with temperature-based color */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 opacity-70 transition-colors duration-500"
                        style={{
                          height: `${Math.max(120, 120 + (currentState.volume - 1) * 25)}px`,
                          background: `linear-gradient(to top, 
                            hsl(${Math.max(0, 240 - (currentState.temperature - 300) * 3)}, 70%, 60%), 
                            hsl(${Math.max(0, 240 - (currentState.temperature - 300) * 3)}, 50%, 70%))`
                        }}
                      ></div>
                      
                      {/* Stirrer */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className={`w-1 sm:w-2 h-16 sm:h-24 bg-gray-700 rounded-full ${isRunning ? 'animate-pulse' : ''}`}></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className={`w-10 sm:w-16 h-0.5 sm:h-1 bg-gray-700 rounded-full ${isRunning ? 'animate-spin' : ''}`}></div>
                        </div>
                      </div>

                      {/* Reaction bubbles based on reaction rate */}
                      {isRunning && simulatorRef.current && (
                        <>
                          {Array.from({ length: Math.min(6, Math.floor(simulatorRef.current.getReactionRate() * 100)) }).map((_, i) => (
                            <div 
                              key={i}
                              className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full opacity-60 animate-bounce"
                              style={{
                                bottom: `${12 + Math.random() * 30}%`,
                                left: `${20 + Math.random() * 60}%`,
                                animationDelay: `${Math.random() * 2}s`
                              }}
                            ></div>
                          ))}
                        </>
                      )}

                      {/* Temperature display */}
                      <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-black bg-opacity-50 text-white text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                        {currentState.temperature.toFixed(1)} K
                      </div>
                      
                      {/* Volume display */}
                      <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-black bg-opacity-50 text-white text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                        {currentState.volume.toFixed(3)} m³
                      </div>
                      
                      {/* Concentration display */}
                      <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 bg-black bg-opacity-50 text-white text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                        {currentState.concentration.toFixed(3)} mol/m³
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coolant Outlet */}
                <div className="absolute bottom-8 sm:bottom-16 left-2 sm:left-8 flex items-center">
                  <div className="bg-cyan-600 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                    Coolant Out: {currentState.jacketTemp.toFixed(1)} K
                  </div>
                  <div className="w-8 sm:w-16 h-0.5 bg-cyan-600 ml-1 sm:ml-2"></div>
                </div>

                {/* Product Output */}
                <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-8 flex items-center">
                  <div className="w-8 sm:w-16 h-0.5 bg-green-500 mr-1 sm:mr-2"></div>
                  <div className="bg-green-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                    Product: {(simulatorRef.current?.getConversion() || 0).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Process Control Parameters */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200">
              <div className="flex items-center space-x-2 mb-4 sm:mb-6">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Process Control Parameters</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <ControlSlider
                  label="Inlet Flow Rate (F0)"
                  value={cstrParams.inletFlowRate}
                  onChange={(val) => handleParameterChange('inletFlowRate', val)}
                  min={0.1}
                  max={3}
                  step={0.1}
                  unit="m³/s"
                />
                <ControlSlider
                  label="Feed Concentration (CA0)"
                  value={cstrParams.feedConcentration}
                  onChange={(val) => handleParameterChange('feedConcentration', val)}
                  min={0.1}
                  max={2}
                  step={0.1}
                  unit="mol/m³"
                />
                <ControlSlider
                  label="Feed Temperature (T0)"
                  value={cstrParams.feedTemperature}
                  onChange={(val) => handleParameterChange('feedTemperature', val)}
                  min={300}
                  max={400}
                  step={5}
                  unit="K"
                />
                <ControlSlider
                  label="Jacket Inlet Temp (TJ0)"
                  value={cstrParams.jacketInletTemp}
                  onChange={(val) => handleParameterChange('jacketInletTemp', val)}
                  min={280}
                  max={350}
                  step={5}
                  unit="K"
                />
                <ControlSlider
                  label="Valve Constant (KV)"
                  value={cstrParams.valveConstant}
                  onChange={(val) => handleParameterChange('valveConstant', val)}
                  min={0.01}
                  max={0.5}
                  step={0.01}
                  unit="m³/(s·m³)"
                />
                <ControlSlider
                  label="Pre-exponential Factor (α)"
                  value={cstrParams.preExponentialFactor}
                  onChange={(val) => handleParameterChange('preExponentialFactor', val)}
                  min={0.1}
                  max={10}
                  step={0.1}
                  unit="1/s"
                />
                <ControlSlider
                  label="Activation Energy (E)"
                  value={cstrParams.activationEnergy}
                  onChange={(val) => handleParameterChange('activationEnergy', val)}
                  min={5000}
                  max={20000}
                  step={1000}
                  unit="J/mol"
                />
                <ControlSlider
                  label="Reaction Order (n)"
                  value={cstrParams.reactionOrder}
                  onChange={(val) => handleParameterChange('reactionOrder', val)}
                  min={1}
                  max={3}
                  step={0.1}
                  unit=""
                />
                <ControlSlider
                  label="Heat Transfer Coeff (U)"
                  value={cstrParams.heatTransferCoeff}
                  onChange={(val) => handleParameterChange('heatTransferCoeff', val)}
                  min={50}
                  max={500}
                  step={10}
                  unit="W/(m²·K)"
                />
              </div>
            </div>

            {/* Performance and Safety Status - Horizontal Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Performance Panel */}
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md border border-gray-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Performance</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Status:</span>
                    <span className={`text-xs sm:text-sm font-medium ${isRunning ? 'text-green-600' : 'text-gray-500'}`}>
                      {isRunning ? 'Running' : 'Stopped'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Outlet Flow:</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      {simulatorRef.current ? simulatorRef.current.getOutletFlow().toFixed(3) : '0'} m³/s
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Residence Time:</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      {simulatorRef.current ? simulatorRef.current.getResidenceTime().toFixed(1) : '0'} s
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Conversion:</span>
                    <span className="text-xs sm:text-sm font-medium text-blue-600">
                      {simulatorRef.current ? simulatorRef.current.getConversion().toFixed(1) : '0'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Heat Removal:</span>
                    <span className="text-xs sm:text-sm font-medium text-cyan-600">
                      {simulatorRef.current ? simulatorRef.current.getHeatRemovalRate().toFixed(2) : '0'} kW
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-600">Reaction Rate:</span>
                    <span className="text-xs sm:text-sm font-medium text-purple-600">
                      {simulatorRef.current ? simulatorRef.current.getReactionRate().toFixed(6) : '0'} mol/(m³·s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Safety Status */}
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md border border-gray-200">
                <div className="flex items-center space-x-2 mb-4">
                  <Thermometer className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Safety Status</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      safetyStatus.temperature === 'danger' ? 'bg-red-500' :
                      safetyStatus.temperature === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <span className="text-xs sm:text-sm text-gray-600 flex-1">Temperature</span>
                    {safetyStatus.temperature === 'danger' && <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      safetyStatus.concentration === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <span className="text-xs sm:text-sm text-gray-600">Concentration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      safetyStatus.volume === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <span className="text-xs sm:text-sm text-gray-600">Volume</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      safetyStatus.conversion === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <span className="text-xs sm:text-sm text-gray-600">Conversion</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Live Parameters */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md border border-gray-200">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Live Parameters</h2>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <MiniGraph 
                  title="Volume" 
                  data={history.volume} 
                  color="#8B5CF6" 
                  unit="m³"
                  min={0}
                  max={2}
                />
                <MiniGraph 
                  title="Concentration" 
                  data={history.concentration} 
                  color="#3B82F6" 
                  unit="mol/m³"
                  min={0}
                  max={1}
                />
                <MiniGraph 
                  title="Temperature" 
                  data={history.temperature} 
                  color="#EF4444" 
                  unit="K"
                  min={300}
                  max={400}
                />
                <MiniGraph 
                  title="Jacket Temperature" 
                  data={history.jacketTemp} 
                  color="#F97316" 
                  unit="K"
                  min={290}
                  max={320}
                />
                <MiniGraph 
                  title="Conversion" 
                  data={history.conversion} 
                  color="#10B981" 
                  unit="%"
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AssumptionsModal 
        isOpen={showAssumptions} 
        onClose={() => setShowAssumptions(false)} 
      />
    </div>
  );
}

export default App;