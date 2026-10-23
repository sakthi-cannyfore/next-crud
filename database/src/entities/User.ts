import { Check, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

// This class describes one row in the users table.
@Entity("users")
@Unique("UQ_users_email", ["email"])
@Check("CHK_users_role", `"role" IN ('admin', 'editor', 'viewer')`)
export class User {
  @PrimaryGeneratedColumn("uuid", { primaryKeyConstraintName: "PK_users" })
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 254 })
  email!: string;

  @Column({ type: "varchar", length: 20, default: "viewer" })
  role!: "admin" | "editor" | "viewer";

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
