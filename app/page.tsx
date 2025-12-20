import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-border-green bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <span className="material-symbols-outlined text-2xl">sync_alt</span>
            </div>
            <span className="text-lg font-bold tracking-tight">TermSync</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary transition-colors" href="#">
              기능
            </a>
            <a className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary transition-colors" href="#">
              가격
            </a>
            <a className="text-sm font-medium text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-primary transition-colors" href="#">
              로그인
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/workspace"
              className="hidden md:inline-flex h-9 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-bold text-background-dark transition-transform hover:scale-105 hover:shadow-glow"
            >
              시작하기
            </Link>
            <button className="md:hidden p-2 text-gray-600 dark:text-gray-300">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-32 lg:pb-28">
          {/* Background Gradient Effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none z-0" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto gap-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                새로운 AI 엔진 업데이트
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight text-gray-900 dark:text-white">
                기술 문서의 <span className="text-primary selection:text-white">완벽한 일치</span>,<br />
                TermSync
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
                AI가 당신의 문서를 분석하여 용어를 자동으로 통일하고 관리합니다. <br className="hidden md:block" />
                더 이상 수동으로 검토하지 마세요. 기술 문서의 품질을 즉시 높여보세요.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                <Link
                  href="/workspace"
                  className="inline-flex h-12 md:h-14 items-center justify-center rounded-full bg-primary px-8 text-base md:text-lg font-bold text-background-dark shadow-glow transition-all hover:scale-105 hover:shadow-glow-lg"
                >
                  무료로 시작하기
                  <span className="material-symbols-outlined ml-2 text-xl">arrow_forward</span>
                </Link>
                <button className="inline-flex h-12 md:h-14 items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 bg-transparent px-8 text-base md:text-lg font-medium text-gray-900 dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-white/10">
                  데모 영상 보기
                  <span className="material-symbols-outlined ml-2 text-xl">play_circle</span>
                </button>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="mt-16 relative mx-auto max-w-5xl rounded-xl border border-gray-200 dark:border-border-green bg-white/50 dark:bg-surface-dark/50 p-2 backdrop-blur shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-background-light via-transparent to-transparent dark:from-background-dark dark:via-transparent dark:to-transparent z-20 h-full w-full pointer-events-none" />
              <div className="relative rounded-lg overflow-hidden aspect-[16/9] bg-gray-900">
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center p-8 border border-white/10 bg-white/5 backdrop-blur-md rounded-2xl max-w-md">
                    <span className="material-symbols-outlined text-6xl text-primary mb-4">auto_awesome</span>
                    <h3 className="text-2xl font-bold text-white mb-2">AI 분석 중...</h3>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                      <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "75%" }} />
                    </div>
                    <p className="text-gray-300 text-sm">문서의 용어 일관성을 검사하고 있습니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white/50 dark:bg-[#0c1a12]">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                TermSync의 핵심 기능
              </h2>
              <p className="text-gray-600 dark:text-gray-400">복잡한 문서 작업, AI로 단순화하세요.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group relative rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-border-green p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/50">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-background-dark transition-colors">
                  <span className="material-symbols-outlined text-3xl">bolt</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                  빠른 분석
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  대량의 문서도 수 초 내에 스캔하여 용어 불일치를 찾아냅니다. 엔진 최적화로 대기 시간을 획기적으로 줄였습니다.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group relative rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-border-green p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/50">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-background-dark transition-colors">
                  <span className="material-symbols-outlined text-3xl">description</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                  다양한 형식
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  PDF, Word, Markdown 등 현업에서 사용하는 모든 기술 문서 포맷을 완벽하게 지원하고 변환합니다.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group relative rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-border-green p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/50">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-background-dark transition-colors">
                  <span className="material-symbols-outlined text-3xl">check_circle</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                  정확한 통일
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  단순 매칭이 아닙니다. 문맥을 이해하는 LLM AI가 가장 적합한 업계 표준 용어를 제안합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-gray-900 dark:text-white">
              지금 바로 문서 품질을 높이세요
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
              수백 페이지의 문서를 일일이 검수하는 시간을 아껴 더 중요한 일에 집중하세요.
            </p>
            <Link
              href="/workspace"
              className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-10 text-lg font-bold text-background-dark shadow-lg transition-transform hover:scale-105"
            >
              무료로 시작하기
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-border-green bg-background-light dark:bg-background-dark py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-sm">sync_alt</span>
              </div>
              <span className="text-gray-900 dark:text-white font-bold text-lg">TermSync</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-500 dark:text-gray-400">
              <a className="hover:text-primary transition-colors" href="#">이용약관</a>
              <a className="hover:text-primary transition-colors" href="#">개인정보처리방침</a>
              <a className="hover:text-primary transition-colors" href="#">문의하기</a>
            </div>
          </div>
          <div className="mt-8 text-center md:text-left text-xs text-gray-400 dark:text-gray-600">
            © 2024 TermSync. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

