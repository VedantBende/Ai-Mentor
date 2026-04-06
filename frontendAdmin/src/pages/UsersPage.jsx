import { users } from "../data/adminData";

function UsersPage() {
  return (
    <>
      <div className="border-b p-6 md:p-8 flex items-center justify-between" style={{ borderColor: "var(--neutral-100)" }}>
        <h2 className="text-3xl font-semibold">All Users</h2>
        <div className="flex gap-2">
          <button type="button" className="h-10 px-4 rounded-xl border" style={{ borderColor: "var(--neutral-100)" }}>Filter</button>
          <button type="button" className="h-10 px-4 rounded-xl text-white" style={{ backgroundColor: "var(--admin-primary)" }}>+ Add User</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[225px]">
          <thead className="text-left text-xs uppercase tracking-wider" style={{ color: "rgba(51,51,51,0.6)" }}>
            <tr className="border-b" style={{ borderColor: "var(--neutral-100)" }}>
              <th className="p-5">User</th>
              <th>Email</th>
              <th>Enrolled Courses</th>
              <th>Join Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {users.map(([name, mail, enrolled, joinDate, status]) => (
              <tr key={mail} className="border-b" style={{ borderColor: "var(--neutral-100)" }}>
                <td className="p-5 font-medium">{name}</td>
                <td>{mail}</td>
                <td>{enrolled}</td>
                <td>{joinDate}</td>
                <td className={status === "Active" ? "text-green-600" : "text-red-600"}>{status}</td>
                <td className="text-lg">...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default UsersPage;