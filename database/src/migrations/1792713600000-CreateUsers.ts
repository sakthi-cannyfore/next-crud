import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsers1792713600000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID CONSTRAINT "PK_users" PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(254) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'viewer',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE (email),
        CONSTRAINT "CHK_users_role" CHECK (role IN ('admin', 'editor', 'viewer'))
      )
    `);

    await queryRunner.query("ALTER TABLE users ENABLE ROW LEVEL SECURITY");
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE users");
  }
}
