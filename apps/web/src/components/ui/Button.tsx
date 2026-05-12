export default function Button({ children }: { children: React.ReactNode }) {
  return (
    <button className="px-6 py-2 rounded-md bg-green-600 hover:bg-green-500">
      {children}
    </button>
  );
}
