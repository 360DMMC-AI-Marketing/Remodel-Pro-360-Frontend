import logo from "../../assets/logo-transparent.png";

const EmailVerificationInfo = () => {
    return (
        <div className="bg-neutral-100 h-screen w-screen flex justify-center items-center">
            <div className="text-center py-5 px-10 rounded-xl bg-white shadow-md">
                <img src={logo} alt="RP360 Logo" className="w-64 mx-auto"/>
                <p className="text-lg font-bold">Email Verification</p>
                <p className="text-sm text-neutral-500">Please check your email for a verification link</p>
            </div>
        </div>
    )
}

export default EmailVerificationInfo