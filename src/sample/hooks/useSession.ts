const useSession = () => {
  return {
    session: null,
    setSession: (session: any) => {
      session = session;
    },
  };
};

export default useSession;
