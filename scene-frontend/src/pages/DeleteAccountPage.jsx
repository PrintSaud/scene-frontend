import React from "react";

export default function DeleteAccountPage() {
  return (
    <div style={styles.page}>
      <div style={styles.glowOne} />
      <div style={styles.glowTwo} />

      <main style={styles.container}>
        <a href="/" style={styles.brand}>
          Scene
        </a>

        <div style={styles.card}>
          <div style={styles.badge}>ACCOUNT & DATA</div>

          <h1 style={styles.title}>
            Delete your Scene account
          </h1>

          <p style={styles.intro}>
            You can request deletion of your Scene account and the data
            associated with it using the steps below.
          </p>

          <section style={styles.section}>
            <div style={styles.number}>1</div>

            <div>
              <h2 style={styles.heading}>
                Request account deletion
              </h2>

              <p style={styles.text}>
                Send an email to{" "}
                <a
                  href="mailto:sauduk11@gmail.com?subject=Scene%20Account%20Deletion%20Request"
                  style={styles.link}
                >
                  sauduk11@gmail.com
                </a>{" "}
                from the email address associated with your Scene account.
              </p>

              <p style={styles.text}>
                Use the subject{" "}
                <strong style={styles.strong}>
                  “Scene Account Deletion Request”
                </strong>{" "}
                and include your Scene username.
              </p>
            </div>
          </section>

          <section style={styles.section}>
            <div style={styles.number}>2</div>

            <div>
              <h2 style={styles.heading}>
                What will be deleted
              </h2>

              <p style={styles.text}>
                When your account deletion request is completed, data
                associated with your Scene account will be deleted, including
                where applicable:
              </p>

              <ul style={styles.list}>
                <li>Account and profile information</li>
                <li>Movie and TV watch activity</li>
                <li>Ratings and reviews</li>
                <li>Comments and replies</li>
                <li>Lists and watchlists</li>
                <li>Favourite movies, shows and characters</li>
                <li>Social activity associated with your account</li>
                <li>Uploaded profile and review content</li>
              </ul>
            </div>
          </section>

          <section style={styles.section}>
            <div style={styles.number}>3</div>

            <div>
              <h2 style={styles.heading}>
                Data retention
              </h2>

              <p style={styles.text}>
                Scene does not retain account data for continued use after
                account deletion. Limited information may be retained only
                where necessary for security, fraud prevention, legal
                obligations, dispute resolution or regulatory requirements.
                Any such information is retained only for as long as required
                for those purposes.
              </p>
            </div>
          </section>

          <div style={styles.notice}>
            <strong style={styles.noticeTitle}>
              Important
            </strong>

            <p style={styles.noticeText}>
              Account deletion is permanent. Once your account and associated
              data have been deleted, they may not be recoverable.
            </p>
          </div>

          <hr style={styles.divider} />

          <div style={styles.arabic} dir="rtl">
            <div style={styles.badge}>حذف الحساب والبيانات</div>

            <h2 style={styles.arabicTitle}>
              حذف حسابك في Scene
            </h2>

            <p style={styles.arabicText}>
              لطلب حذف حسابك والبيانات المرتبطة به، أرسل رسالة من البريد
              الإلكتروني المرتبط بحسابك إلى{" "}
              <a
                href="mailto:sauduk11@gmail.com?subject=Scene%20Account%20Deletion%20Request"
                style={styles.link}
              >
                sauduk11@gmail.com
              </a>
              ، واكتب اسم المستخدم الخاص بك في Scene.
            </p>

            <p style={styles.arabicText}>
              عند إتمام حذف الحساب، سيتم حذف بيانات الحساب والمحتوى المرتبط به
              مثل التقييمات، المراجعات، التعليقات، سجل المشاهدة، القوائم
              والمفضلة. قد يتم الاحتفاظ ببيانات محدودة فقط عند الحاجة لأسباب
              قانونية أو أمنية أو تنظيمية، وللمدة اللازمة لذلك فقط.
            </p>
          </div>
        </div>

        <footer style={styles.footer}>
          <span>Scene</span>
          <span style={styles.dot}>•</span>
          <span>Digital Visual Vision Establishment</span>
        </footer>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at 20% 0%, rgba(179,39,246,0.16), transparent 34%), #090909",
    color: "#fff",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    position: "relative",
    overflow: "hidden",
  },

  glowOne: {
    position: "fixed",
    width: 460,
    height: 460,
    borderRadius: "50%",
    background: "rgba(109,40,217,0.10)",
    filter: "blur(110px)",
    top: -170,
    right: -180,
    pointerEvents: "none",
  },

  glowTwo: {
    position: "fixed",
    width: 360,
    height: 360,
    borderRadius: "50%",
    background: "rgba(179,39,246,0.08)",
    filter: "blur(100px)",
    bottom: -160,
    left: -130,
    pointerEvents: "none",
  },

  container: {
    width: "min(820px, calc(100% - 32px))",
    margin: "0 auto",
    padding: "46px 0 54px",
    position: "relative",
    zIndex: 1,
  },

  brand: {
    display: "inline-block",
    color: "#fff",
    fontSize: 27,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-1.2px",
    textDecoration: "none",
    marginBottom: 26,
  },

  card: {
    background: "rgba(17,17,17,0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: "clamp(24px, 5vw, 50px)",
    boxShadow: "0 28px 80px rgba(0,0,0,0.40)",
    backdropFilter: "blur(16px)",
  },

  badge: {
    display: "inline-block",
    color: "#c768ff",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "1.6px",
    marginBottom: 12,
  },

  title: {
    fontSize: "clamp(34px, 6vw, 52px)",
    lineHeight: 1.04,
    letterSpacing: "-2px",
    margin: "0 0 18px",
  },

  intro: {
    color: "#aaa",
    fontSize: 17,
    lineHeight: 1.7,
    margin: "0 0 42px",
    maxWidth: 650,
  },

  section: {
    display: "flex",
    alignItems: "flex-start",
    gap: 18,
    marginBottom: 34,
  },

  number: {
    width: 34,
    height: 34,
    minWidth: 34,
    borderRadius: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #6D28D9, #B327F6)",
    fontWeight: 800,
    fontSize: 14,
    boxShadow: "0 8px 22px rgba(179,39,246,0.22)",
  },

  heading: {
    fontSize: 20,
    margin: "3px 0 10px",
    letterSpacing: "-0.3px",
  },

  text: {
    color: "#b9b9b9",
    lineHeight: 1.72,
    fontSize: 15,
    margin: "0 0 9px",
  },

  strong: {
    color: "#fff",
  },

  link: {
    color: "#c768ff",
    textDecoration: "none",
    fontWeight: 700,
  },

  list: {
    color: "#b9b9b9",
    lineHeight: 1.85,
    fontSize: 15,
    paddingLeft: 21,
    margin: "8px 0 0",
  },

  notice: {
    background: "rgba(179,39,246,0.08)",
    border: "1px solid rgba(179,39,246,0.22)",
    borderRadius: 16,
    padding: "18px 20px",
    marginTop: 8,
  },

  noticeTitle: {
    display: "block",
    marginBottom: 6,
    fontSize: 14,
  },

  noticeText: {
    margin: 0,
    color: "#aaa",
    fontSize: 14,
    lineHeight: 1.65,
  },

  divider: {
    border: 0,
    height: 1,
    background: "rgba(255,255,255,0.08)",
    margin: "42px 0",
  },

  arabic: {
    textAlign: "right",
  },

  arabicTitle: {
    fontSize: 28,
    margin: "2px 0 15px",
  },

  arabicText: {
    color: "#b9b9b9",
    fontSize: 16,
    lineHeight: 1.9,
    margin: "0 0 12px",
  },

  footer: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    paddingTop: 26,
  },

  dot: {
    margin: "0 8px",
    color: "#B327F6",
  },
};
