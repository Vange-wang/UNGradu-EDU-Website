export default function LoginPage() {
  return (
    <div className="page">
      <section className="content-panel">
        <h1 className="section-title">手机号登录</h1>
        <p>
          M1 将先接入本地测试登录流程；正式上线前必须替换为合规手机号短信登录，
          并由后端可信机制维护登录态。
        </p>

        <form className="form">
          <div className="field">
            <label htmlFor="phone">手机号</label>
            <input id="phone" name="phone" inputMode="tel" placeholder="请输入手机号" />
          </div>
          <div className="field">
            <label htmlFor="code">验证码</label>
            <input id="code" name="code" inputMode="numeric" placeholder="请输入验证码" />
          </div>
          <button className="button primary" type="button">
            登录并进入主页面
          </button>
        </form>
      </section>
    </div>
  );
}
