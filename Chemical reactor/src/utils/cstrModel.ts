// CSTR Mathematical Model Implementation - Based on MATLAB Reference
export interface CSTRState {
  volume: number;           // m³
  concentration: number;    // mol/m³
  temperature: number;      // K
  jacketTemp: number;       // K
  time: number;            // s
}

export interface CSTRParameters {
  inletFlowRate: number;        // m³/s (F0)
  feedConcentration: number;    // mol/m³ (CA0)
  feedTemperature: number;      // K (T0)
  jacketInletTemp: number;      // K (TJ0)
  valveConstant: number;        // m³/(s·m³) (KV)
  minimumVolume: number;        // m³ (Vmin)
  preExponentialFactor: number; // 1/s (alpha)
  activationEnergy: number;     // J/mol (E)
  gasConstant: number;          // J/(mol·K) (R)
  reactionOrder: number;        // dimensionless (n)
  density: number;              // kg/m³ (rho)
  heatCapacity: number;         // J/(kg·K) (Cp)
  heatOfReaction: number;       // J/mol (lambda)
  heatTransferCoeff: number;    // W/(m²·K) (U)
  heatTransferArea: number;     // m² (AH)
  jacketDensity: number;        // kg/m³ (rhoJ)
  jacketHeatCapacity: number;   // J/(kg·K) (CJ)
  jacketVolume: number;         // m³ (VJ)
  jacketFlowRate: number;       // m³/s (FJ)
}

export class CSTRSimulator {
  private state: CSTRState;
  private params: CSTRParameters;
  private dt: number = 0.1; // time step in seconds

  constructor(initialState: CSTRState, parameters: CSTRParameters) {
    this.state = { ...initialState };
    this.params = { ...parameters };
  }

  // Calculate outlet flow rate based on valve equation
  private getOutletFlowRate(): number {
    return this.params.valveConstant * (this.state.volume - this.params.minimumVolume);
  }

  // Arrhenius equation for temperature-dependent reaction rate constant
  private calculateRateConstant(): number {
    return this.params.preExponentialFactor * 
           Math.exp(-this.params.activationEnergy / (this.params.gasConstant * this.state.temperature));
  }

  // Reaction rate with nth order kinetics
  private getReactionRateValue(): number {
    const k = this.calculateRateConstant();
    return k * Math.pow(this.state.concentration, this.params.reactionOrder);
  }

  // Volume balance: dV/dt = F0 - F
  private volumeDerivative(): number {
    const outletFlow = this.getOutletFlowRate();
    return this.params.inletFlowRate - outletFlow;
  }

  // Mass balance: dCA/dt = (F0*CA0 - F*CA - V*r) / V
  private concentrationDerivative(): number {
    const outletFlow = this.getOutletFlowRate();
    const reactionRate = this.getReactionRateValue();
    
    return (this.params.inletFlowRate * this.params.feedConcentration - 
            outletFlow * this.state.concentration - 
            this.state.volume * reactionRate) / this.state.volume;
  }

  // Energy balance: dT/dt = (rho*Cp*(F0*T0 - F*T) - lambda*V*r - U*AH*(T - TJ)) / (rho*Cp*V)
  private temperatureDerivative(): number {
    const outletFlow = this.getOutletFlowRate();
    const reactionRate = this.getReactionRateValue();
    const volumetricHeatCapacity = this.params.density * this.params.heatCapacity;
    
    const convectiveTerm = volumetricHeatCapacity * 
                          (this.params.inletFlowRate * this.params.feedTemperature - 
                           outletFlow * this.state.temperature);
    const reactionTerm = this.params.heatOfReaction * this.state.volume * reactionRate;
    const heatTransferTerm = this.params.heatTransferCoeff * this.params.heatTransferArea * 
                           (this.state.temperature - this.state.jacketTemp);
    
    return (convectiveTerm - reactionTerm - heatTransferTerm) / 
           (volumetricHeatCapacity * this.state.volume);
  }

  // Jacket energy balance: dTJ/dt = (FJ*rhoJ*CJ*(TJ0 - TJ) + U*AH*(T - TJ)) / (rhoJ*VJ*CJ)
  private jacketTempDerivative(): number {
    const jacketHeatCapacity = this.params.jacketDensity * this.params.jacketHeatCapacity;
    
    const convectiveTerm = this.params.jacketFlowRate * jacketHeatCapacity * 
                          (this.params.jacketInletTemp - this.state.jacketTemp);
    const heatTransferTerm = this.params.heatTransferCoeff * this.params.heatTransferArea * 
                           (this.state.temperature - this.state.jacketTemp);
    
    return (convectiveTerm + heatTransferTerm) / 
           (jacketHeatCapacity * this.params.jacketVolume);
  }

  // Runge-Kutta 4th order integration
  public step(): CSTRState {
    const k1_v = this.dt * this.volumeDerivative();
    const k1_c = this.dt * this.concentrationDerivative();
    const k1_t = this.dt * this.temperatureDerivative();
    const k1_tj = this.dt * this.jacketTempDerivative();

    // Store original state
    const originalState = { ...this.state };

    // Calculate k2
    this.state.volume += k1_v / 2;
    this.state.concentration += k1_c / 2;
    this.state.temperature += k1_t / 2;
    this.state.jacketTemp += k1_tj / 2;

    const k2_v = this.dt * this.volumeDerivative();
    const k2_c = this.dt * this.concentrationDerivative();
    const k2_t = this.dt * this.temperatureDerivative();
    const k2_tj = this.dt * this.jacketTempDerivative();

    // Calculate k3
    this.state = { ...originalState };
    this.state.volume += k2_v / 2;
    this.state.concentration += k2_c / 2;
    this.state.temperature += k2_t / 2;
    this.state.jacketTemp += k2_tj / 2;

    const k3_v = this.dt * this.volumeDerivative();
    const k3_c = this.dt * this.concentrationDerivative();
    const k3_t = this.dt * this.temperatureDerivative();
    const k3_tj = this.dt * this.jacketTempDerivative();

    // Calculate k4
    this.state = { ...originalState };
    this.state.volume += k3_v;
    this.state.concentration += k3_c;
    this.state.temperature += k3_t;
    this.state.jacketTemp += k3_tj;

    const k4_v = this.dt * this.volumeDerivative();
    const k4_c = this.dt * this.concentrationDerivative();
    const k4_t = this.dt * this.temperatureDerivative();
    const k4_tj = this.dt * this.jacketTempDerivative();

    // Final update
    this.state = { ...originalState };
    this.state.volume += (k1_v + 2*k2_v + 2*k3_v + k4_v) / 6;
    this.state.concentration += (k1_c + 2*k2_c + 2*k3_c + k4_c) / 6;
    this.state.temperature += (k1_t + 2*k2_t + 2*k3_t + k4_t) / 6;
    this.state.jacketTemp += (k1_tj + 2*k2_tj + 2*k3_tj + k4_tj) / 6;
    this.state.time += this.dt;

    return { ...this.state };
  }

  public updateParameters(newParams: Partial<CSTRParameters>): void {
    this.params = { ...this.params, ...newParams };
  }

  public getState(): CSTRState {
    return { ...this.state };
  }

  public getConversion(): number {
    if (this.params.feedConcentration === 0) return 0;
    return ((this.params.feedConcentration - this.state.concentration) / 
            this.params.feedConcentration) * 100;
  }

  public getResidenceTime(): number {
    const outletFlow = this.getOutletFlowRate();
    return outletFlow > 0 ? this.state.volume / outletFlow : 0;
  }

  public getHeatRemovalRate(): number {
    return (this.params.heatTransferCoeff * this.params.heatTransferArea * 
            (this.state.temperature - this.state.jacketTemp)) / 1000; // kW
  }

  public getReactionRate(): number {
    return this.getReactionRateValue();
  }

  public getOutletFlow(): number {
    return this.getOutletFlowRate();
  }
}