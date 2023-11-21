import { useContext, useRef, useState } from "react";
import Input from "./Input";
import styles from "./Form.module.css";
import inputStyles from "./Input.module.css";
import { motion } from "framer-motion";
import InputDataPGSchema from "@/validations/InputDataPGSchema";
import axios from "axios";
import InputDataInterface from "@/interfaces/InputDataInterface";
import { ZodIssue } from "zod";
import Card from "@/wrappers/Card";
import DataContext from "@/context/data-context";
import SearchStatus from "./SearchStatus";

const FormPG: React.FC<{ switchHandler: (state: boolean) => void }> = ({
  switchHandler,
}) => {
  const orderIdRef = useRef<HTMLInputElement>(null);
  const appIdRef = useRef<HTMLInputElement>(null);
  const namaDebiturRef = useRef<HTMLInputElement>(null);
  const noKtpRef = useRef<HTMLInputElement>(null);

  const [errorObject, setErrorObject] = useState<{
    errorPath: string[];
    errorMessage: string[];
  } | null>(null);

  const [buttonDisabled, setButtonDisabled] = useState<boolean | undefined>(
    undefined
  );

  const [errorFromServer, setErrorFromServer] = useState<string | undefined>(
    undefined
  );

  const dataContext = useContext(DataContext);

  const errorClassName = `${inputStyles.input} ${inputStyles["input-error"]}`;

  const submitHandler: React.FormEventHandler = (event: React.FormEvent) => {
    event.preventDefault();

    const orderId = orderIdRef.current?.value;
    const appId = appIdRef.current?.value;
    const namaDebitur = namaDebiturRef.current?.value;
    const noKtp = noKtpRef.current?.value;

    const inputData: InputDataInterface = {
      application_no: orderId,
      app_id: appId,
      nama_nasabah: namaDebitur,
      no_ktp: noKtp,
    };

    const validation = InputDataPGSchema.safeParse(inputData);

    let paramListBuffer = [];
    for (const key in inputData) {
      if (inputData[key as keyof InputDataInterface] !== "") {
        let param = {
          [key]: inputData[key as keyof InputDataInterface],
        };
        paramListBuffer.push(param);
      }
    }

    dataContext.searchParametersPGHandler(paramListBuffer);

    if (validation.success) {
      console.log("Data is valid ==>", validation.data);
      console.log("Sending your request!");

      postDataHandler(validation.data);

      orderIdRef.current!.value = "";
      appIdRef.current!.value = "";
      namaDebiturRef.current!.value = "";
      noKtpRef.current!.value = "";

      setErrorObject(null);
    } else {
      const zodErrors: ZodIssue[] = validation.error.issues;

      const errorPath = zodErrors.map((e) => e.path[0].toString());
      const errorMessage = zodErrors.map((e) => e.message.toString());

      setErrorObject({ errorPath, errorMessage });
    }
  };

  const postDataHandler = async (data: InputDataInterface) => {
    try {
      dataContext.isSearchingHandlerPG(true);
      setButtonDisabled(true);

      const searchDataResponse = await axios.post("/api/search-data-pg", data);

      if (searchDataResponse.data.noParams) {
        dataContext.searchStatusHandlerPG(false);
        dataContext.searchParametersPGHandler([searchDataResponse.data]);
      } else if (
        searchDataResponse.status === 200 &&
        searchDataResponse.statusText === "OK" &&
        !searchDataResponse.data.error &&
        Object.keys(searchDataResponse.data.personalInfo).length !== 0
      ) {
        dataContext.searchStatusHandlerPG(true);
        dataContext.resultDataHandler(searchDataResponse.data);
      } else {
        dataContext.searchStatusHandlerPG(false);
      }

      dataContext.isSearchingHandlerPG(false);
      setButtonDisabled(undefined);
    } catch (error: any) {
      console.error(error);
      setErrorFromServer(error.response.data.message);
      dataContext.searchParametersPGHandler([{}]);
      dataContext.searchStatusHandlerPG(null);
      dataContext.isSearchingHandlerPG(null);
      setButtonDisabled(undefined);
    }
  };

  return (
    <Card>
      <form className={styles.form} onSubmit={submitHandler}>
        <Input
          labelName="No. Aplikasi (alias Order ID)"
          idForName="application-no"
          type="text"
          className={
            errorObject?.errorPath.includes("application_no")
              ? errorClassName
              : inputStyles.input
          }
          ref={orderIdRef}
        />
        {
          <p>
            {errorObject?.errorMessage.filter((e) => e.includes("Order ID"))}
          </p>
        }

        <Input
          labelName="App ID"
          idForName="app-id"
          type="text"
          className={
            errorObject?.errorPath.includes("app_id")
              ? errorClassName
              : inputStyles.input
          }
          ref={appIdRef}
        />
        {<p>{errorObject?.errorMessage.filter((e) => e.includes("App ID"))}</p>}

        <Input
          labelName="Nama Nasabah"
          idForName="nama-nasabah"
          type="text"
          className={
            errorObject?.errorPath.includes("nama_nasabah")
              ? errorClassName
              : inputStyles.input
          }
          ref={namaDebiturRef}
        />
        {<p>{errorObject?.errorMessage.filter((e) => e.includes("Kindly"))}</p>}

        <Input
          labelName="No. KTP"
          idForName="no-ktp"
          type="text"
          className={
            errorObject?.errorPath.includes("no_ktp")
              ? errorClassName
              : inputStyles.input
          }
          ref={noKtpRef}
        />
        {
          <p>
            {errorObject?.errorMessage.filter((e) => e.includes("No. KTP"))}
          </p>
        }
        <motion.button
          className={styles["submit-button"]}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          type="submit"
          disabled={buttonDisabled}
        >
          Search
        </motion.button>
        <motion.button
          className={styles["switch-button-mongo"]}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          type="submit"
          disabled={buttonDisabled}
          onClick={(event: React.MouseEvent) => {
            event.preventDefault();
            switchHandler(false);
          }}
        >
          Switch
        </motion.button>
      </form>
      {dataContext.isSearchingPG === false && (
        <SearchStatus
          searchParams={dataContext.searchParametersPG}
          form={"PG"}
        />
      )}
      <h5 style={{ color: "red" }}>
        {errorFromServer ? errorFromServer : undefined}
      </h5>
    </Card>
  );
};

export default FormPG;
