"use client"

import type React from "react"
import type { UseFormReturn } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  MECHANISMS,
  MOTOR_CONTROLLERS,
  MOTORS,
  getCompatibleMotors,
  isMotorCompatibleWithController,
} from "@/lib/config/hardware-config"
import ReCalcIntegration from "./recalc-integration"

export default function MechanismForm({ form }: { form: UseFormReturn<any> }) {
  const mechanismType = form.watch("mechanismType")
  const motorControllerType = form.watch("motorControllerType", "SparkMAX")
  const motorType = form.watch("motorType", "NEO")

  // Get all available controllers and motors from the configuration
  const allControllers = Object.values(MOTOR_CONTROLLERS)
  const allMotors = Object.values(MOTORS)

  // Get compatible controllers and motors based on current selections
  const compatibleMotors = getCompatibleMotors(motorControllerType)

  // Handle motor controller change
  const handleMotorControllerChange = (value: string) => {
    form.setValue("motorControllerType", value)

    // If changing away from TalonFX and using a Kraken motor, switch to KrakenX60
    if (value !== "TalonFX" && !isMotorCompatibleWithController(motorType, value)) {
      form.setValue("motorType", "NEO")
    } else if (value === "TalonFX" && !isMotorCompatibleWithController(motorType, value)) {
      form.setValue("motorType", "Krakenx60")
    }
  }

  // Handle motor type change
  const handleMotorTypeChange = (value: string) => {
    form.setValue("motorType", value)
  }

  // Safe number input handler
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (...event: any[]) => void) => {
    const value = e.target.value
    if (value === "") {
      onChange("")
    } else {
      const numValue = Number.parseFloat(value)
      if (!isNaN(numValue)) {
        onChange(numValue)
      }
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="subsystemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alt Sistem Adı</FormLabel>
                  <FormControl>
                    <Input placeholder="MekanizmaAltSistemi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mechanismType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mekanizma Tipi</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Mekanizma tipi seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(MECHANISMS).map((mechanism) => (
                        <SelectItem key={mechanism.name} value={mechanism.name}>
                          {mechanism.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="w-full" defaultValue="motorConfig">
        <AccordionItem value="motorConfig">
          <AccordionTrigger>Motor Yapılandırması</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="motorControllerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motor Kontrolcü Modeli</FormLabel>
                    <Select onValueChange={handleMotorControllerChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Motor kontrolcü seçin (Ör: SparkMAX)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allControllers.map((controller) => (
                          <SelectItem key={controller.name} value={controller.name}>
                            {controller.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motorType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motor Tipi</FormLabel>
                    <Select onValueChange={handleMotorTypeChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Motor tipi seçin (Ör: NEO)" />
                        </SelectTrigger>
                      </FormControl>
                    <SelectContent>
                      {compatibleMotors.map((motor) => (
                        <SelectItem key={motor.name} value={motor.name}>
                          {motor.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                    <FormDescription>
                      {!isMotorCompatibleWithController("NEO", motorControllerType)
                        ? "Kraken motorlar yalnızca TalonFX ile kullanılabilir"
                        : ""}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="canId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CAN ID</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => handleNumberChange(e, field.onChange)} />
                    </FormControl>
                    <FormDescription>Motor kontrolcüsünün CAN hattındaki adresi</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gearRatio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dişli Oranı</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        {...field}
                        onChange={(e) => handleNumberChange(e, field.onChange)}
                      />
                    </FormControl>
                    <FormDescription>Motorun, mekanizmanın 1 tam turu için kaç tur attığını gösterir. Örneğin: Dişli oranı 15 ise, mekanizma 1 tur attığında motor 15 tur döner.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brakeMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Fren Modu</FormLabel>
                      <FormDescription>Sürücü sinyal kesildiğinde motor durmaya çalışır. "Coast" ise serbest bırakır.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Ramp Süresi (saniye)</Label>
                <FormDescription className="text-sm text-muted-foreground mb-2">
                  Motorun tam güce/hıza ulaşma süresini kontrol eder.
                </FormDescription>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rampRates.openLoop"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Joystick → Motor geçiş süresi (saniye)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Joystick → Motor gücü geçişini yumuşatır. 0 = kapalı (motor anında tam güce çıkar).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rampRates.closedLoop"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PID/Hız kontrolü geçiş süresi (saniye)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.0"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>PID/velocity kontrolünde motorun tam hıza ulaşma süresi. 0 = kapalı.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Akım Sınırlamaları</Label>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currentLimits.stator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motor Stator Akım Limiti (A)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="40"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Motor sargılarındaki maksimum akımı sınırlar (A), bu da maksimum torku sınırlar.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {MOTOR_CONTROLLERS[motorControllerType].supportsSupplyCurrentLimit && (
                    <FormField
                      control={form.control}
                      name="currentLimits.supply"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Besleme Akım Limiti (A)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="40"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => handleNumberChange(e, field.onChange)}
                            />
                          </FormControl>
                          <FormDescription>Yalnızca TalonFX/TalonFXS için</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="controlConfig">
          <AccordionTrigger>Kontrol Yapılandırması</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>PID Değerleri ({mechanismType == "Elevator" ? "Metre Cinsinden" : "Radyan Cinsinden"})</Label>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="pidValues.kP"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>kP</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Oransal kazanç. Hatanın büyüklüğüne göre motor çıkışını ayarlar.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pidValues.kI"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>kI</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>İntegral kazanç. Sürekli kalan küçük hataları zamanla düzeltir.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pidValues.kD"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>kD</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Türevsel kazanç. Hızlı değişimleri kontrol ederek aşım ve salınımı azaltır.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hareket Limitleri</Label>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxVelocity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maksimum Hız</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Mekanizmanın izin verilen en yüksek doğrusal hızı (m/s).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxAcceleration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maksimum İvme</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Sistemin ulaşmasına izin verilen maksimum hızlanma değeri (m/s²).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Yumuşak Limitler (Soft Limits)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="softLimits.forward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İleri Limit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Mekanizmanın erişebileceği en yüksek konum sınırı.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="softLimits.reverse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geri Limit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Mekanizmanın erişebileceği en düşük konum sınırı.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Feedforward Terimleri</Label>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="feedforward.kS"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>kS (Static Friction)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Mekanizmanın harekete başlayabilmesi için gereken minimum voltaj (statik sürtünme telafisi).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="feedforward.kV"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>kV (Velocity)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Sabit bir hızı sürdürmek için gereken voltajı belirleyen hız katsayısı.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="feedforward.kA"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>kA (Acceleration)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>İvmelenme sırasında ihtiyaç duyulan ek voltajı belirleyen ivme katsayısı.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(mechanismType === "Elevator" || mechanismType === "Arm") && (
                    <FormField
                      control={form.control}
                      name="feedforward.kG"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>kG (Gravity)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => handleNumberChange(e, field.onChange)}
                            />
                          </FormControl>
                          <FormDescription>Yerçekiminin etkisini dengelemek için mekanizmaya uygulanan sabit voltaj (özellikle kol ve elevator sistemleri için).</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <ReCalcIntegration
                    formValues={form.getValues()}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="telemetry">
          <AccordionTrigger>Telemetri</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="telemetry.ntKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NetworkTables Anahtarı</FormLabel>
                    <FormControl>
                      <Input placeholder="Subsystem" {...field} />
                    </FormControl>
                    <FormDescription>Telemetri değerleri için temel yol</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telemetry.positionUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konum Birimi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Konum birimi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Rotations">Dönüşler</SelectItem>
                        <SelectItem value="Radians">Radyan</SelectItem>
                        <SelectItem value="Degrees">Derece</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Telemetri Değerleri</Label>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telemetry.position"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Konum</FormLabel>
                          <FormDescription>Motor konumunu kaydet</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telemetry.velocity"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Hız</FormLabel>
                          <FormDescription>Motor hızını kaydet</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telemetry.voltage"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Gerilim</FormLabel>
                          <FormDescription>Uygulanan gerilimi kaydet</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telemetry.temperature"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Sıcaklık</FormLabel>
                          <FormDescription>Motor sıcaklığını kaydet</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telemetry.current"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Akım</FormLabel>
                          <FormDescription>Motor akımını kaydet</FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {mechanismType === "Elevator" && (
          <AccordionItem value="elevatorParams">
            <AccordionTrigger>Elevator Parametreleri</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="elevatorParams.startingHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Başlangıç Yüksekliği (m)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => handleNumberChange(e, field.onChange)}
                        />
                      </FormControl>
                      <FormDescription>Başlangıç yüksekliği. Simülasyonun veya mekanizmanın ilk konumu.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="elevatorParams.hardLimitMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Yükseklik</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Alt sert limit. Elevator'ın inebileceği minimum fiziksel yükseklik.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="elevatorParams.hardLimitMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maksimum Yükseklik</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Üst sert limit. Elevator'ın çıkabileceği maksimum fiziksel yükseklik.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="elevatorParams.mass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kütle</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Elevator yükünün kütlesi.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="elevatorParams.massUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kütle Birimi</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kütle birimi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                            <SelectItem value="lbs">Pound (lbs)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>Kütle birimi (kg veya lbs).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="elevatorParams.drumRadius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dişli Yarıçapı</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => handleNumberChange(e, field.onChange)}
                        />
                      </FormControl>
                      <FormDescription>
                        Tambur/dişli yarıçapı. Motorun dönüşünü doğrusal mesafeye çevirmek için kullanılan yarıçap değeri.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {mechanismType === "Arm" && (
          <AccordionItem value="armParams">
            <AccordionTrigger>Arm Parameters</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="armParams.length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kol Uzunluğu (m)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => handleNumberChange(e, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="armParams.startingPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Başlangıç Konumu (derece)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => handleNumberChange(e, field.onChange)}
                        />
                      </FormControl>
                      <FormDescription>Simülasyon için başlangıç açısı</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="armParams.hardLimitMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Sert Limit (derece)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Simülasyonda ulaşılabilecek minimum açı</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="armParams.hardLimitMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maksimum Sert Limit (derece)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Simülasyonda ulaşılabilecek maksimum açı</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="armParams.mass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kütle</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="armParams.massUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kütle Birimi</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kütle birimi seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                            <SelectItem value="lbs">Pound (lbs)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="armParams.centerOfMass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ağırlık Merkezi (metre)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="1"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => handleNumberChange(e, field.onChange)}
                          />
                        </FormControl>
                        <FormDescription>Destek noktasından ağırlık merkezine olan mesafe (metre).</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}
