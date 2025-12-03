package frc.robot.subsystems;

import edu.wpi.first.epilogue.Logged;
import edu.wpi.first.wpilibj2.command.SubsystemBase;
import edu.wpi.first.wpilibj.simulation.ElevatorSim;
import edu.wpi.first.math.controller.ElevatorFeedforward;
import edu.wpi.first.math.controller.ProfiledPIDController;
import edu.wpi.first.math.trajectory.TrapezoidProfile;
import edu.wpi.first.math.system.plant.DCMotor;
import edu.wpi.first.wpilibj.simulation.RoboRioSim;
import edu.wpi.first.wpilibj2.command.Command;
import com.revrobotics.spark.SparkMax;
import com.revrobotics.spark.config.SparkMaxConfig;
import com.revrobotics.spark.config.IdleMode;
import com.revrobotics.spark.config.ResetMode;
import com.revrobotics.spark.config.PersistMode;
import com.revrobotics.spark.MotorType;
import com.revrobotics.spark.RelativeEncoder;
import com.revrobotics.spark.simulation.SparkSim;

/**
 * SparkMAX ve NEO motor ile Elevator alt sistemi.
 * Elevator konumu ve hızı PID + feedforward ile kontrol edilir.
 */
@Logged(name = "ElevatorSubsystem")
public class ElevatorSubsystem extends SubsystemBase {

  // Sabitler
  private final DCMotor dcMotor = DCMotor.getNEO(1);
  private final int canID = 1;
  private final double gearRatio = 15;
  private final double kP = 1;
  private final double kI = 0;
  private final double kD = 0;
  private final double kS = 0;
  private final double kV = 0;
  private final double kA = 0;
  private final double kG = 0;
  private final double maxVelocity = 1; // metre/saniye
  private final double maxAcceleration = 1; // metre/saniye²
  private final boolean brakeMode = true;
  private final boolean enableStatorLimit = true;
  private final int statorCurrentLimit = 40;
  private final boolean enableSupplyLimit = false;
  private final double supplyCurrentLimit = 40;
  private final double drumRadius = 0.0254; // metre
  private final double minheight = 0;
  private final double maxheight = 1;

  // Feedforward
  private final ElevatorFeedforward feedforward = new ElevatorFeedforward(
    kS,
    kG,
    kV,
    kA
  );

  // Motor kontrolü
  private final SparkMax motor;
  private final RelativeEncoder encoder;
  private final SparkSim motorSim;

  // Kontrol modları
  public enum ControlMode {
    OPEN_LOOP,   // Açık döngü voltaj
    POSITION,    // Konum kontrolü
    VELOCITY,    // Hız kontrolü
  }

  private ControlMode currentControlMode = ControlMode.OPEN_LOOP;
  private double targetPosition = 0.0;
  private double targetVelocity = 0.0;

  // Profiled PID Controller
  private ProfiledPIDController profiledPIDController;
  private TrapezoidProfile.Constraints constraints;

  // Simülasyon
  private final ElevatorSim elevatorSim;

  /**
   * Elevator alt sistemi oluşturur.
   */
  public ElevatorSubsystem() {
    // Motor kontrolcüsünü başlat
    SparkMaxConfig motorConfig = new SparkMaxConfig();
    motor = new SparkMax(canID, MotorType.kBrushless);
    motorConfig.idleMode(brakeMode ? IdleMode.kBrake : IdleMode.kCoast);

    // Encoder ayarla
    encoder = motor.getEncoder();
    encoder.setPosition(0);

    // Akım limitlerini ayarla
    motorConfig.smartCurrentLimit(statorCurrentLimit);

    // Konfigürasyonu uygula
    motor.configure(
      motorConfig,
      ResetMode.kResetSafeParameters,
      PersistMode.kPersistParameters
    );
    motorSim = new SparkSim(motor, dcMotor);

    // Simülasyonu başlat
    elevatorSim = new ElevatorSim(
      dcMotor, // Motor tipi
      gearRatio,
      5, // Taşıma kütlesi (kg)
      drumRadius, // Dişli yarıçapı (m)
      0, // Minimum yükseklik (m)
      1, // Maksimum yükseklik (m)
      true, // Yerçekimi simülasyonu
      0 // Başlangıç yüksekliği (m)
    );

    // ProfiledPIDController başlat
    // Kısıtlamalar için metreyi rotasyona çevir
    double maxVelocityRotations = maxVelocity / (2.0 * Math.PI * drumRadius);
    double maxAccelerationRotations =
      maxAcceleration / (2.0 * Math.PI * drumRadius);

    constraints = new TrapezoidProfile.Constraints(
      maxVelocityRotations,
      maxAccelerationRotations
    );
    profiledPIDController = new ProfiledPIDController(kP, kI, kD, constraints);
  }

  /**
   * Sabit frekansta çalışan kontrol döngüsü.
   * SparkMAX ve SparkFlex kontrolcüler için ana robot döngüsü dışında kapalı döngü sağlar.
   */
  private void controlLoopFn() {
    switch (currentControlMode) {
      case POSITION:
        double currentPos = getPosition();
        double output = profiledPIDController.calculate(
          currentPos,
          targetPosition
        );
        double velocity = profiledPIDController.getSetpoint().velocity;
        double feedforwardOutput = feedforward.calculate(velocity);
        setVoltage(output + feedforwardOutput);
        break;
      case VELOCITY:
        double currentVel = getVelocity();
        double velOutput = profiledPIDController.calculate(
          currentVel,
          targetVelocity
        );
        double accel =
          profiledPIDController.getSetpoint().velocity - currentVel;
        double velFeedforwardOutput = feedforward.calculate(
          targetVelocity,
          accel
        );

        // PID ve feedforward çıkışını motora uygula
        double velocityVoltage = velOutput + velFeedforwardOutput;
        motor.setVoltage(velocityVoltage);
        break;
      case OPEN_LOOP:
      default:
        // Açık döngü, voltaj doğrudan ayarlanır
        break;
    }
  }

  /**
   * Alt sistemi kapatırken kaynakları temizle.
   */
  public void close() {
    motor.close();
  }

  /**
   * Simülasyon ve telemetriyi güncelle.
   */
  @Override
  public void periodic() {
    controlLoopFn();
  }

  /**
   * Simülasyonu güncelle.
   */
  @Override
  public void simulationPeriodic() {
    // Metre -> Rotasyon oranı
    double positionToRotations = (1 / (2.0 * Math.PI * drumRadius)) * gearRatio;

    // Motor voltajını simülasyona uygula
    elevatorSim.setInput(getVoltage());

    // 20ms ile simülasyonu güncelle
    elevatorSim.update(0.020);

    // Metreleri motor rotasyonuna çevir
    double motorPosition =
      elevatorSim.getPositionMeters() * positionToRotations;
    double motorVelocity =
      elevatorSim.getVelocityMetersPerSecond() * positionToRotations;

    motorSim.iterate(motorVelocity * 60, RoboRioSim.getVInVoltage(), 0.02);
  }

  /** Mevcut konumu rotasyon olarak al */
  @Logged(name = "Position/Rotations")
  public double getPosition() {
    return encoder.getPosition() / gearRatio;
  }

  /** Mevcut hızı rotasyon/saniye olarak al */
  @Logged(name = "Velocity")
  public double getVelocity() {
    return encoder.getVelocity() / gearRatio / 60.0; // RPM -> RPS
  }

  /** Uygulanan voltajı al */
  @Logged(name = "Voltage")
  public double getVoltage() {
    return motor.getAppliedOutput() * motor.getBusVoltage();
  }

  /** Mevcut motor akımını al */
  public double getCurrent() {
    return motor.getOutputCurrent();
  }

  /** Mevcut motor sıcaklığını al */
  public double getTemperature() {
    return motor.getMotorTemperature();
  }

  /** Elevator konumunu ayarla (metre) */
  public void setPosition(double position) {
    setPosition(position, 0);
  }

  /** Elevator konumunu ve ivmeyi ayarla */
  public void setPosition(double position, double acceleration) {
    double positionRotations = position / (2.0 * Math.PI * drumRadius);
    targetPosition = positionRotations;
    currentControlMode = ControlMode.POSITION;

    if (acceleration > 0) {
      double maxAccelRotations = acceleration / (2.0 * Math.PI * drumRadius);
      constraints = new TrapezoidProfile.Constraints(
        constraints.maxVelocity,
        maxAccelRotations
      );
      profiledPIDController.setConstraints(constraints);
    }
  }

  /** Elevator hızını ayarla (m/s) */
  public void setVelocity(double velocity) {
    setVelocity(velocity, 0);
  }

  /** Elevator hızını ve ivmesini ayarla */
  public void setVelocity(double velocity, double acceleration) {
    double velocityRotations = velocity / (2.0 * Math.PI * drumRadius);
    targetVelocity = velocityRotations;
    currentControlMode = ControlMode.VELOCITY;

    if (acceleration > 0) {
      double maxAccelRotations = acceleration / (2.0 * Math.PI * drumRadius);
      constraints = new TrapezoidProfile.Constraints(
        constraints.maxVelocity,
        maxAccelRotations
      );
      profiledPIDController.setConstraints(constraints);
    }
  }

  /** Motor voltajını doğrudan ayarla */
  public void setVoltage(double voltage) {
    currentControlMode = ControlMode.OPEN_LOOP;
    motor.setVoltage(voltage);
  }

  /** Elevator simülasyon modelini al (test için) */
  public ElevatorSim getSimulation() {
    return elevatorSim;
  }

  public double getMinHeightMeters() {
    return minheight;
  }

  public double getMaxHeightMeters() {
    return maxheight;
  }

  /** Elevator'u belirli bir yüksekliğe ayarlamak için komut oluştur */
  public Command setHeightCommand(double heightMeters) {
    return runOnce(() -> setPosition(heightMeters));
  }

  /** Elevator'u belirli bir yüksekliğe hareket ettirmek için komut oluştur */
  public Command moveToHeightCommand(double heightMeters) {
    return run(() -> setPosition(heightMeters))
      .until(() -> {
        double currentHeight = getPosition() * (2.0 * Math.PI * drumRadius);
        return Math.abs(heightMeters - currentHeight) < 0.02; // 2cm tolerans
      });
  }

  /** Elevator'u durdurmak için komut oluştur */
  public Command stopCommand() {
    return runOnce(() -> setVelocity(0));
  }

  /** Elevator'u belirli bir hızda hareket ettirmek için komut oluştur */
  public Command moveAtVelocityCommand(double velocityMetersPerSecond) {
    return run(() -> setVelocity(velocityMetersPerSecond));
  }
}

