import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMaintenancesTable1793113003314 implements MigrationInterface {
  name = 'CreateMaintenancesTable1793113003314';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Added by hand: lets the GiST exclusion constraint compare uuid values with =.
    // Not dropped in down(): extensions are database-wide and may be shared.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);
    await queryRunner.query(
      `CREATE TYPE "public"."maintenance_type_enum" AS ENUM('PREVENTIVE', 'CORRECTIVE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."maintenance_status_enum" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "maintenances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."maintenance_type_enum" NOT NULL, "description" character varying(1000) NOT NULL, "mileage" integer NOT NULL, "scheduledStartDate" TIMESTAMP WITH TIME ZONE NOT NULL, "scheduledEndDate" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."maintenance_status_enum" NOT NULL DEFAULT 'SCHEDULED', "workPerformed" character varying(2000), "finalCost" numeric(12,2), "finalMileage" integer, "finishedAt" TIMESTAMP WITH TIME ZONE, "vehicleId" uuid NOT NULL, "mechanicId" uuid NOT NULL, "workshopId" uuid NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "EX_maintenances_mechanic_schedule" EXCLUDE USING gist ("mechanicId" WITH =, tstzrange("scheduledStartDate", "scheduledEndDate", '[)') WITH &&) WHERE ("status" IN ('SCHEDULED', 'IN_PROGRESS')), CONSTRAINT "PK_62403473bd524a42d58589aa78b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_daa193fdfccde41a2ed4de8a47" ON "maintenances"  ("vehicleId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3a9ba7c05e1ffba00560d11f36" ON "maintenances"  ("mechanicId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_maintenances_active_vehicle" ON "maintenances"  ("vehicleId") WHERE "status" IN ('SCHEDULED', 'IN_PROGRESS')`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenances" ADD CONSTRAINT "FK_daa193fdfccde41a2ed4de8a474" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenances" ADD CONSTRAINT "FK_3a9ba7c05e1ffba00560d11f364" FOREIGN KEY ("mechanicId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenances" ADD CONSTRAINT "FK_75331cd2a0f0c22bcb2fc4f6d6a" FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "maintenances" DROP CONSTRAINT "FK_75331cd2a0f0c22bcb2fc4f6d6a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenances" DROP CONSTRAINT "FK_3a9ba7c05e1ffba00560d11f364"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenances" DROP CONSTRAINT "FK_daa193fdfccde41a2ed4de8a474"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."UQ_maintenances_active_vehicle"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3a9ba7c05e1ffba00560d11f36"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_daa193fdfccde41a2ed4de8a47"`,
    );
    await queryRunner.query(`DROP TABLE "maintenances"`);
    await queryRunner.query(`DROP TYPE "public"."maintenance_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."maintenance_type_enum"`);
  }
}
