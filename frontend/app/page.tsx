"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, Role, User, UserInput } from "../lib/api";

const emptyForm: UserInput = { name: "", email: "", role: "viewer" };

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<UserInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.list().then(setUsers)
      .catch(error => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const input = { ...form, name: form.name.trim(), email: form.email.trim() };
      const user = editingId ? await api.update(editingId, input) : await api.create(input);
      setUsers(current => editingId
        ? current.map(item => item.id === user.id ? user : item)
        : [user, ...current]);
      resetForm();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(user: User) {
    if (!window.confirm(`Delete ${user.name}?`)) return;
    setBusy(true);
    setError("");
    try {
      await api.remove(user.id);
      setUsers(current => current.filter(item => item.id !== user.id));
      if (editingId === user.id) resetForm();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>Users</h1>
      <h2>{editingId ? "Edit user" : "Add user"}</h2>
      <form onSubmit={saveUser}>
        <fieldset disabled={busy || loading}>
          <label>Name
            <input required maxLength={100} value={form.name}
              onChange={event => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>Email
            <input required type="email" maxLength={254} value={form.email}
              onChange={event => setForm({ ...form, email: event.target.value })} />
          </label>
          <label>Role
            <select value={form.role}
              onChange={event => setForm({ ...form, role: event.target.value as Role })}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button type="submit">{busy ? "Saving..." : editingId ? "Update user" : "Add user"}</button>
          {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        </fieldset>
      </form>
      {error && <p role="alert">{error}</p>}
      {loading ? <p>Loading users...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Actions</th></tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={4}>No users found.</td></tr>}
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td><td>{user.email}</td><td>{user.role}</td>
                  <td className="actions">
                    <button disabled={busy} onClick={() => {
                      setEditingId(user.id);
                      setForm({ name: user.name, email: user.email, role: user.role });
                      setError("");
                    }}>Edit</button>
                    <button disabled={busy} onClick={() => void deleteUser(user)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
