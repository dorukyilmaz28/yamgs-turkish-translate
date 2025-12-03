package frc.robot.subsystems;

import edu.wpi.first.wpilibj2.command.SubsystemBase;
import edu.wpi.first.wpilibj.smartdashboard.SmartDashboard;
import edu.wpi.first.wpilibj.util.Color;
import edu.wpi.first.wpilibj.util.Color8Bit;
import edu.wpi.first.wpilibj.simulation.Mechanism2d;
import edu.wpi.first.wpilibj.simulation.MechanismRoot2d;
import edu.wpi.first.wpilibj.simulation.MechanismLigament2d;

// NOT: Bunları RobotContainer.java'ya eklemelisiniz

// private final ElevatorSubsystemSim elevatorsim; - Diğer alt sistemlerinizi tanımladığınız yer burası olmalı.

// elevatorsim = new ElevatorSubsystemSim(elevator); - RobotContainer fonksiyonunun içinde bu satırı ekleyin.

/**
 * Elevator alt sistemi için simülasyon görselleştirmesi.
 */
public class ElevatorSubsystemSim extends SubsystemBase {

  private final ElevatorSubsystem elevator;

  // Simülasyon ekranı
  private final Mechanism2d mech;
  private final MechanismRoot2d root;
  private final MechanismLigament2d elevatorMech;

  // Görselleştirme sabitleri
  private final double VISUAL_WIDTH = 10.0; // Görselleştirmenin genişliği (piksel)
  private final double BASE_HEIGHT = 20.0; // Taban yüksekliği (piksel)
  private final double CARRIAGE_WIDTH = 30.0; // Elevator taşıyıcı genişliği (piksel)
  private final double CARRIAGE_HEIGHT = 40.0; // Elevator taşıyıcı yüksekliği (piksel)

  // Elevator parametreleri
  private final double minHeight;
  private final double maxHeight;
  private final double visualScaleFactor;

  /**
   * Elevator için yeni bir görselleştirme oluşturur.
   *
   * @param elevatorSubsystem Görselleştirilecek elevator alt sistemi
   */
  public ElevatorSubsystemSim(ElevatorSubsystem elevatorSubsystem) {
    this.elevator = elevatorSubsystem;

    // Elevator parametrelerini simülasyondan al
    minHeight = elevator.getMinHeightMeters();
    maxHeight = elevator.getMaxHeightMeters();

    // Görselleştirme ölçeğini hesapla
    double elevatorTravel = maxHeight - minHeight;
    visualScaleFactor = 300.0 / elevatorTravel; // Yaklaşık 300 piksel maksimum

    // Simülasyon ekranını oluştur
    mech = new Mechanism2d(400, 400);
    root = mech.getRoot("ElevatorRoot", 200, 50);

    // Elevator tabanını ekle
    MechanismLigament2d elevatorBase = root.append(
      new MechanismLigament2d(
        "Base",
        BASE_HEIGHT,
        90,
        6,
        new Color8Bit(Color.kDarkGray)
      )
    );

    // Elevator kulesini ekle
    MechanismLigament2d elevatorTower = elevatorBase.append(
      new MechanismLigament2d(
        "Tower",
        (maxHeight - minHeight) * visualScaleFactor,
        90,
        VISUAL_WIDTH,
        new Color8Bit(Color.kGray)
      )
    );

    // Elevator taşıyıcıyı ekle
    elevatorMech = root.append(
      new MechanismLigament2d(
        "Elevator",
        BASE_HEIGHT,
        90,
        CARRIAGE_WIDTH,
        new Color8Bit(Color.kBlue)
      )
    );

    // Görselleştirmeyi başlat
    SmartDashboard.putData("Elevator Sim", mech);
  }

  @Override
  public void periodic() {
    // Elevator yüksekliğini güncelle
    double currentHeight = elevator.getSimulation().getPositionMeters();
    double displayHeight =
      BASE_HEIGHT + (currentHeight - minHeight) * visualScaleFactor;

    elevatorMech.setLength(displayHeight);

    // Telemetri verilerini ekle
    SmartDashboard.putNumber("Elevator Yüksekliği (m)", currentHeight);
    SmartDashboard.putNumber(
      "Elevator Hızı (m/s)",
      elevator.getSimulation().getVelocityMetersPerSecond()
    );
    SmartDashboard.putNumber(
      "Elevator Akımı (A)",
      elevator.getSimulation().getCurrentDrawAmps()
    );
  }
}

