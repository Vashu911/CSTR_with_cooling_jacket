import React from 'react';
import { X, BookOpen, AlertCircle } from 'lucide-react';

interface AssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssumptionsModal: React.FC<AssumptionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Variable Volume CSTR Model</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">About This Simulation</h3>
                <p className="text-blue-800 text-sm">
                  This simulation implements a variable volume CSTR with nth-order kinetics, based on the MATLAB reference model. 
                  The reactor volume changes dynamically based on inlet and outlet flow rates, providing realistic process behavior.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Physical Assumptions</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Perfect Mixing:</strong> Reactor contents are perfectly mixed throughout</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Variable Volume:</strong> Volume changes based on inlet/outlet flow balance</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Valve-Controlled Outlet:</strong> Outlet flow = KV × (V - Vmin)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Constant Density:</strong> Liquid density remains constant</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Lumped Jacket:</strong> Jacket temperature dynamics included</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Chemical Assumptions</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>nth-Order Reaction:</strong> A → B with rate = α × exp(-E/RT) × CA^n</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Arrhenius Kinetics:</strong> Temperature-dependent rate constant</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Exothermic Reaction:</strong> Reaction releases heat (λ &gt; 0)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Single Reaction:</strong> Only one chemical reaction occurs</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span><strong>Variable Order:</strong> Reaction order can be adjusted (typically n=1-3)</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Mathematical Model</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Volume Balance:</h4>
                <code className="text-sm bg-white px-3 py-1 rounded border block">
                  dV/dt = F₀ - F, where F = KV × (V - Vmin)
                </code>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Mass Balance:</h4>
                <code className="text-sm bg-white px-3 py-1 rounded border block">
                  dCA/dt = (F₀×CA₀ - F×CA - V×r) / V
                </code>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Energy Balance:</h4>
                <code className="text-sm bg-white px-3 py-1 rounded border block">
                  dT/dt = (ρCp(F₀T₀ - FT) - λVr - UA(T - TJ)) / (ρCpV)
                </code>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Jacket Energy Balance:</h4>
                <code className="text-sm bg-white px-3 py-1 rounded border block">
                  dTJ/dt = (FJρJCJ(TJ₀ - TJ) + UA(T - TJ)) / (ρJVJCJ)
                </code>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Reaction Rate:</h4>
                <code className="text-sm bg-white px-3 py-1 rounded border block">
                  r = α × exp(-E/RT) × CA^n
                </code>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Variable Definitions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p><strong>V:</strong> Reactor volume (m³)</p>
                <p><strong>CA:</strong> Reactant concentration (mol/m³)</p>
                <p><strong>T:</strong> Reactor temperature (K)</p>
                <p><strong>TJ:</strong> Jacket temperature (K)</p>
                <p><strong>F₀:</strong> Inlet flow rate (m³/s)</p>
                <p><strong>F:</strong> Outlet flow rate (m³/s)</p>
                <p><strong>KV:</strong> Valve constant (m³/(s·m³))</p>
                <p><strong>Vmin:</strong> Minimum volume (m³)</p>
              </div>
              <div className="space-y-1">
                <p><strong>α:</strong> Pre-exponential factor (1/s)</p>
                <p><strong>E:</strong> Activation energy (J/mol)</p>
                <p><strong>R:</strong> Gas constant (8.314 J/(mol·K))</p>
                <p><strong>n:</strong> Reaction order</p>
                <p><strong>λ:</strong> Heat of reaction (J/mol)</p>
                <p><strong>U:</strong> Heat transfer coefficient (W/(m²·K))</p>
                <p><strong>A:</strong> Heat transfer area (m²)</p>
                <p><strong>ρ:</strong> Density (kg/m³)</p>
                <p><strong>Cp:</strong> Heat capacity (J/(kg·K))</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Key Features</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Variable volume reactor with dynamic level control</li>
              <li>• nth-order reaction kinetics (adjustable from 1st to 3rd order)</li>
              <li>• Arrhenius temperature dependence for reaction rate</li>
              <li>• Dynamic jacket cooling with thermal lag</li>
              <li>• Real-time parameter adjustment and visualization</li>
              <li>• Safety monitoring for temperature, volume, and conversion</li>
              <li>• 4th-order Runge-Kutta integration for numerical accuracy</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Default Parameters (Based on MATLAB Reference)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
              <div className="space-y-1">
                <p>F₀ = 1.0 m³/s</p>
                <p>CA₀ = 0.5 mol/m³</p>
                <p>T₀ = 350 K</p>
                <p>TJ₀ = 300 K</p>
                <p>V₀ = 1.0 m³</p>
                <p>KV = 0.1 m³/(s·m³)</p>
                <p>Vmin = 0.1 m³</p>
              </div>
              <div className="space-y-1">
                <p>α = 1.0 1/s</p>
                <p>E = 10,000 J/mol</p>
                <p>n = 2 (2nd order)</p>
                <p>U = 100 W/(m²·K)</p>
                <p>λ = 1.0 J/mol</p>
                <p>ρ = 1000 kg/m³</p>
                <p>Cp = 4.18 J/(kg·K)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};