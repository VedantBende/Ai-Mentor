import { courses } from "../data/adminData";

function CoursesPage() {
  return (
    <>
      <div className="border-b p-6 md:p-8 flex items-center justify-between" style={{ borderColor: "var(--neutral-100)" }}>
        <h2 className="text-3xl font-semibold">Active Courses</h2>
        <div className="flex gap-2">
          <button type="button" className="h-10 px-4 rounded-xl border" style={{ borderColor: "var(--neutral-100)" }}>Filter</button>
          <button type="button" className="h-10 px-4 rounded-xl border" style={{ borderColor: "var(--neutral-100)" }}>Export</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[225px]">
          <thead className="text-left text-xs uppercase tracking-wider" style={{ color: "rgba(51,51,51,0.6)" }}>
            <tr className="border-b" style={{ borderColor: "var(--neutral-100)" }}>
              <th className="p-5">Course Detail</th>
              <th>Category</th>
              <th>Pricing</th>
              <th>Enrolled</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {courses.map(([name, category, price, enrolled, status]) => (
              <tr key={name} className="border-b" style={{ borderColor: "var(--neutral-100)" }}>
                <td className="p-5">
                  <div className="font-semibold">{name}</div>
                  <div style={{ color: "rgba(51,51,51,0.6)" }}>Last updated recently</div>
                </td>
                <td><span className="px-3 py-1 rounded-full" style={{ backgroundColor: "var(--neutral-50)" }}>{category}</span></td>
                <td className="font-semibold">{price}</td>
                <td>{enrolled}</td>
                <td className={status === "Published" ? "text-green-600" : "text-orange-500"}>{status}</td>
                <td className="text-lg">...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default CoursesPage;