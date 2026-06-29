// Required footer — must be visible on every page for submission
export function Footer() {
  return (
    <footer className="border-t bg-white mt-auto py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
        <span>
          CareerCopilot AI &mdash; built by{' '}
          <a
            href="https://github.com/Jyotirmoy-Baidya"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-700 hover:text-gray-900"
          >
            Jyotirmoy Baidya
          </a>
        </span>
        <div className="flex gap-4">
          <a
            href="https://github.com/Jyotirmoy-Baidya"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/jyotirmoy-baidya/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-800"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
