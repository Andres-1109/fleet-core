import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehiclesTable1793112147977 implements MigrationInterface {
  name = 'CreateVehiclesTable1793112147977';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."vehicle_status_enum" AS ENUM('AVAILABLE', 'IN_MAINTENANCE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plate" character varying(15) NOT NULL, "brand" character varying(50) NOT NULL, "model" character varying(50) NOT NULL, "year" integer NOT NULL, "mileage" integer NOT NULL, "status" "public"."vehicle_status_enum" NOT NULL DEFAULT 'AVAILABLE', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_ec7181ebdab798d97070122a5bf" UNIQUE ("plate"), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "vehicles"`);
    await queryRunner.query(`DROP TYPE "public"."vehicle_status_enum"`);
  }
}
