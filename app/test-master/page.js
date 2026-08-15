"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/* =========================================================
   NIDAN PATHOLOGY LAB
   TEST MASTER

   FEATURES
   ---------------------------------------------------------
   1. Loads tests from "tests" table
   2. Loads old/all prices from "test_prices" table
   3. Combines both tables
   4. Shows ALL tests
   5. Edit Price button for EVERY test
   6. Price saved to test_prices
   7. If test exists in tests table, price also updates there
   8. New price row automatically created if missing
   9. Test Add/Edit/Delete
   10. Test Active/Inactive
   11. Parameters Add/Edit/Delete
   12. Search
   13. Category filter
========================================================= */


/* =========================================================
   CATEGORIES
========================================================= */

const CATEGORIES = [
  "Hematology",
  "Biochemistry",
  "Serology",
  "Clinical Pathology",
  "Hormone",
  "Coagulation",
  "Microbiology",
  "Immunology",
  "Other",
];


/* =========================================================
   EMPTY TEST
========================================================= */

const EMPTY_TEST = {
  name: "",
  short_name: "",
  category: "Hematology",
  department: "Laboratory",
  sample_type: "",
  price: "",
  method: "",
  active: true,
};


/* =========================================================
   EMPTY PARAMETER
========================================================= */

const EMPTY_PARAMETER = {
  parameter_name: "",
  unit: "",
  min_value: "",
  max_value: "",
  reference_range: "",
  options: "",
  sort_order: 1,
  active: true,
};


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function TestMasterPage() {

  const router = useRouter();


  /* =======================================================
     TEST STATES
  ======================================================= */

  const [tests, setTests] = useState([]);

  const [parameters, setParameters] =
    useState([]);


  /* =======================================================
     LOADING STATES
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);


  /* =======================================================
     SEARCH
  ======================================================= */

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");


  /* =======================================================
     TEST FORM
  ======================================================= */

  const [showTestForm, setShowTestForm] =
    useState(false);

  const [editingTestId, setEditingTestId] =
    useState(null);

  const [testForm, setTestForm] =
    useState(EMPTY_TEST);


  /* =======================================================
     PARAMETER FORM
  ======================================================= */

  const [
    showParameterForm,
    setShowParameterForm,
  ] = useState(false);

  const [
    editingParameterId,
    setEditingParameterId,
  ] = useState(null);

  const [
    parameterForm,
    setParameterForm,
  ] = useState(EMPTY_PARAMETER);


  /* =======================================================
     SELECTED TEST
  ======================================================= */

  const [selectedTest, setSelectedTest] =
    useState(null);


  /* =======================================================
     PRICE EDIT
  ======================================================= */

  const [
    showPriceForm,
    setShowPriceForm,
  ] = useState(false);

  const [
    priceEditTest,
    setPriceEditTest,
  ] = useState(null);

  const [
    newPrice,
    setNewPrice,
  ] = useState("");


  /* =======================================================
     LOAD TESTS ON PAGE LOAD
  ======================================================= */

  useEffect(() => {
    loadTests();
  }, []);


  /* =========================================================
     LOAD TESTS
     
     IMPORTANT:
     Loads from BOTH:
       - tests
       - test_prices

     This fixes the problem where only newly added
     tests were showing.
  ========================================================= */

  async function loadTests() {

    try {

      setLoading(true);


      /* -----------------------------------------------------
         LOAD MAIN TESTS TABLE
      ----------------------------------------------------- */

      const {
        data: mainTests,
        error: testsError,
      } = await supabase
        .from("tests")
        .select("*")
        .order("name", {
          ascending: true,
        });


      if (testsError) {
        throw testsError;
      }


      /* -----------------------------------------------------
         LOAD TEST PRICES TABLE
      ----------------------------------------------------- */

      const {
        data: priceTests,
        error: priceError,
      } = await supabase
        .from("test_prices")
        .select("*")
        .order("test_name", {
          ascending: true,
        });


      /*
       If test_prices table has a problem,
       don't completely break Test Master.
      */

      if (priceError) {

        console.warn(
          "test_prices loading warning:",
          priceError
        );

      }


      /* -----------------------------------------------------
         CREATE MAP
      ----------------------------------------------------- */

      const testMap =
        new Map();


      /* -----------------------------------------------------
         ADD TESTS TABLE RECORDS
      ----------------------------------------------------- */

      (mainTests || []).forEach(
        (test) => {

          const key =
            String(test.id);

          testMap.set(
            key,
            {
              ...test,

              source:
                "tests",
            }
          );

        }
      );


      /* -----------------------------------------------------
         ADD / MERGE TEST_PRICES RECORDS
      ----------------------------------------------------- */

      (priceTests || []).forEach(
        (priceTest) => {

          const testId =
            String(
              priceTest.test_id
            );


          /*
           If same test already exists
           in tests table
          */

          const existingTest =
            testMap.get(testId);


          if (existingTest) {

            testMap.set(
              testId,
              {

                ...existingTest,

                /*
                 Price from test_prices
                */
                price:
                  priceTest.price !==
                    null &&
                  priceTest.price !==
                    undefined
                    ? priceTest.price
                    : existingTest.price,

                /*
                 Active state
                */
                active:
                  priceTest.is_active !==
                    null &&
                  priceTest.is_active !==
                    undefined
                    ? priceTest.is_active
                    : existingTest.active,

                /*
                 Keep information
                */
                price_id:
                  priceTest.id,

                price_source:
                  "test_prices",

                source:
                  "tests",

              }
            );

          }

          /*
           OLD TEST EXISTS ONLY IN
           test_prices
          */

          else {

            testMap.set(
              testId,
              {

                id:
                  priceTest.test_id,

                name:
                  priceTest.test_name ||
                  "Unnamed Test",

                short_name:
                  priceTest.test_name ||
                  "",

                category:
                  priceTest.category ||
                  "PATHOLOGY",

                department:
                  "Laboratory",

                sample_type:
                  "",

                price:
                  priceTest.price ||
                  0,

                method:
                  "",

                active:
                  priceTest.is_active !==
                    false,

                source:
                  "test_prices",

                price_id:
                  priceTest.id,

                price_source:
                  "test_prices",

                updated_at:
                  priceTest.updated_at ||
                  null,

              }
            );

          }

        }
      );


      /* -----------------------------------------------------
         MAP -> ARRAY
      ----------------------------------------------------- */

      const finalTests =
        Array.from(
          testMap.values()
        ).sort(
          (a, b) =>
            String(
              a.name || ""
            ).localeCompare(
              String(
                b.name || ""
              )
            )
        );


      setTests(
        finalTests
      );


      /* -----------------------------------------------------
         KEEP SELECTED TEST UPDATED
      ----------------------------------------------------- */

      if (
        selectedTest?.id
      ) {

        const updatedSelected =
          finalTests.find(
            (item) =>
              String(
                item.id
              ) ===
              String(
                selectedTest.id
              )
          );


        if (
          updatedSelected
        ) {

          setSelectedTest(
            updatedSelected
          );

        }

      }


    }

    catch (error) {

      console.error(
        "Test loading error:",
        error
      );


      alert(
        "Tests load nahi ho paaye:\n\n" +
          error.message
      );

    }

    finally {

      setLoading(false);

    }

  }


  /* =========================================================
     LOAD PARAMETERS
  ========================================================= */

  async function loadParameters(
    testId = null
  ) {

    try {

      let query =
        supabase
          .from(
            "test_parameters"
          )
          .select("*")
          .order(
            "sort_order",
            {
              ascending: true,
            }
          );


      if (testId) {

        query =
          query.eq(
            "test_id",
            testId
          );

      }


      const {
        data,
        error,
      } =
        await query;


      if (error) {
        throw error;
      }


      setParameters(
        data || []
      );

    }

    catch (error) {

      console.error(
        "Parameter loading error:",
        error
      );


      alert(
        "Parameters load nahi ho paaye:\n\n" +
          error.message
      );

    }

  }


  /* =========================================================
     OPEN PRICE EDIT
  ========================================================= */

  function openPriceEdit(
    test
  ) {

    setPriceEditTest(
      test
    );


    setNewPrice(
      test.price === null ||
      test.price === undefined
        ? ""
        : String(
            test.price
          )
    );


    setShowPriceForm(
      true
    );

  }


  /* =========================================================
     SAVE PRICE
     
     IMPORTANT:
     Updates:
       1. tests.price
       2. test_prices.price

     If test_prices row doesn't exist,
     automatically INSERTS it.
  ========================================================= */

  async function savePrice(
    event
  ) {

    event.preventDefault();


    if (
      !priceEditTest
    ) {

      alert(
        "Test select nahi hua."
      );

      return;

    }


    const priceText =
      String(
        newPrice
      ).trim();


    if (
      priceText === ""
    ) {

      alert(
        "Price enter karein."
      );

      return;

    }


    const price =
      Number(
        priceText
      );


    if (
      !Number.isFinite(
        price
      ) ||
      price < 0
    ) {

      alert(
        "Valid price enter karein.\n\nExample: 250"
      );

      return;

    }


    try {

      setSaving(true);


      /* ===================================================
         STEP 1
         CHECK MAIN TEST
      =================================================== */

      const {
        data: mainTest,
        error: mainTestError,
      } =
        await supabase
          .from("tests")
          .select("id")
          .eq(
            "id",
            priceEditTest.id
          )
          .maybeSingle();


      if (
        mainTestError
      ) {

        throw mainTestError;

      }


      /* ===================================================
         STEP 2
         UPDATE MAIN TEST PRICE
      =================================================== */

      if (
        mainTest
      ) {

        const {
          error:
            updateTestError,
        } =
          await supabase
            .from("tests")
            .update({

              price:
                price,

              updated_at:
                new Date().toISOString(),

            })
            .eq(
              "id",
              priceEditTest.id
            );


        if (
          updateTestError
        ) {

          throw updateTestError;

        }

      }


      /* ===================================================
         STEP 3
         CHECK test_prices
      =================================================== */

      const {
        data:
          existingPrice,
        error:
          existingPriceError,
      } =
        await supabase
          .from("test_prices")
          .select("*")
          .eq(
            "test_id",
            String(
              priceEditTest.id
            )
          )
          .maybeSingle();


      if (
        existingPriceError
      ) {

        throw existingPriceError;

      }


      /* ===================================================
         STEP 4
         UPDATE EXISTING PRICE
      =================================================== */

      if (
        existingPrice
      ) {

        const {
          error:
            updatePriceError,
        } =
          await supabase
            .from("test_prices")
            .update({

              price:
                price,

              updated_at:
                new Date().toISOString(),

            })
            .eq(
              "test_id",
              String(
                priceEditTest.id
              )
            );


        if (
          updatePriceError
        ) {

          throw updatePriceError;

        }

      }


      /* ===================================================
         STEP 5
         CREATE PRICE ROW IF NOT EXISTS
      =================================================== */

      else {

        const {
          error:
            insertPriceError,
        } =
          await supabase
            .from("test_prices")
            .insert([
              {

                test_id:
                  String(
                    priceEditTest.id
                  ),

                test_name:
                  priceEditTest.name ||
                  priceEditTest.short_name ||
                  "Test",

                category:
                  priceEditTest.category ||
                  "PATHOLOGY",

                price:
                  price,

                is_active:
                  priceEditTest.active !==
                  false,

                updated_at:
                  new Date().toISOString(),

              },
            ]);


        if (
          insertPriceError
        ) {

          throw insertPriceError;

        }

      }


      /* ===================================================
         UPDATE LOCAL SCREEN
      =================================================== */

      setTests(
        (previousTests) =>
          previousTests.map(
            (item) =>
              String(
                item.id
              ) ===
              String(
                priceEditTest.id
              )
                ? {
                    ...item,
                    price:
                      price,
                  }
                : item
          )
      );


      /* ===================================================
         UPDATE SELECTED TEST
      =================================================== */

      if (
        selectedTest &&
        String(
          selectedTest.id
        ) ===
          String(
            priceEditTest.id
          )
      ) {

        setSelectedTest({

          ...selectedTest,

          price:
            price,

        });

      }


      /* ===================================================
         CLOSE MODAL
      =================================================== */

      setShowPriceForm(
        false
      );


      setPriceEditTest(
        null
      );


      setNewPrice(
        ""
      );


      alert(
        `✅ ${priceEditTest.name}\n\nNew Price: ₹${price}\n\nPrice successfully updated.`
      );


      /* ===================================================
         RELOAD
      =================================================== */

      await loadTests();

    }

    catch (error) {

      console.error(
        "Price update error:",
        error
      );


      alert(
        "Price update nahi hua:\n\n" +
          error.message
      );

    }

    finally {

      setSaving(false);

    }

  }


  /* =========================================================
     OPEN NEW TEST
  ========================================================= */

  function openNewTest() {

    setEditingTestId(
      null
    );


    setTestForm({
      ...EMPTY_TEST,
    });


    setSelectedTest(
      null
    );


    setParameters(
      []
    );


    setShowTestForm(
      true
    );


    setShowParameterForm(
      false
    );

  }


  /* =========================================================
     EDIT TEST
  ========================================================= */

  async function editTest(
    test
  ) {

    setEditingTestId(
      test.source ===
        "test_prices"
        ? null
        : test.id
    );


    setTestForm({

      name:
        test.name ||
        "",

      short_name:
        test.short_name ||
        "",

      category:
        test.category ||
        "Hematology",

      department:
        test.department ||
        "Laboratory",

      sample_type:
        test.sample_type ||
        "",

      price:
        test.price ===
          null ||
        test.price ===
          undefined
          ? ""
          : String(
              test.price
            ),

      method:
        test.method ||
        "",

      active:
        test.active ===
          undefined
          ? true
          : test.active,

    });


    setSelectedTest(
      test
    );


    setShowTestForm(
      true
    );


    setShowParameterForm(
      false
    );


    /*
     Only main tests table IDs
     can have parameters.
    */

    if (
      test.source ===
      "tests"
    ) {

      await loadParameters(
        test.id
      );

    }

    else {

      setParameters(
        []
      );

    }

  }


  /* =========================================================
     SAVE TEST
  ========================================================= */

  async function saveTest(
    event
  ) {

    event.preventDefault();


    if (
      !testForm.name.trim()
    ) {

      alert(
        "Test name zaroori hai."
      );

      return;

    }


    try {

      setSaving(true);


      /* ===================================================
         PRICE
      =================================================== */

      const numericPrice =
        testForm.price ===
        ""
          ? 0
          : Number(
              testForm.price
            );


      if (
        !Number.isFinite(
          numericPrice
        ) ||
        numericPrice < 0
      ) {

        alert(
          "Valid price enter karein."
        );

        setSaving(false);

        return;

      }


      /* ===================================================
         MAIN TEST PAYLOAD
      =================================================== */

      const payload = {

        name:
          testForm.name.trim(),

        short_name:
          testForm.short_name.trim(),

        category:
          testForm.category,

        department:
          testForm.department.trim(),

        sample_type:
          testForm.sample_type.trim(),

        price:
          numericPrice,

        method:
          testForm.method.trim(),

        active:
          testForm.active,

        updated_at:
          new Date().toISOString(),

      };


      /* ===================================================
         UPDATE EXISTING MAIN TEST
      =================================================== */

      if (
        editingTestId
      ) {

        const {
          error,
        } =
          await supabase
            .from("tests")
            .update(
              payload
            )
            .eq(
              "id",
              editingTestId
            );


        if (error) {
          throw error;
        }


        /*
         Also update test_prices
        */

        await updateTestPriceRecord(
          editingTestId,
          testForm,
          numericPrice
        );


        alert(
          "Test successfully updated."
        );

      }


      /* ===================================================
         NEW TEST
      =================================================== */

      else {

        const {
          data,
          error,
        } =
          await supabase
            .from("tests")
            .insert([
              payload,
            ])
            .select()
            .single();


        if (error) {
          throw error;
        }


        /*
         Create price record also
        */

        await updateTestPriceRecord(
          data.id,
          {
            ...testForm,
            name:
              data.name,
            category:
              data.category,
            active:
              data.active,
          },
          numericPrice
        );


        setEditingTestId(
          data.id
        );


        setSelectedTest(
          data
        );


        alert(
          "New test successfully added."
        );

      }


      await loadTests();


      if (
        editingTestId
      ) {

        await loadParameters(
          editingTestId
        );

      }


      setShowTestForm(
        false
      );

    }

    catch (error) {

      console.error(
        "Test save error:",
        error
      );


      alert(
        "Test save nahi hua:\n\n" +
          error.message
      );

    }

    finally {

      setSaving(false);

    }

  }


  /* =========================================================
     UPDATE / CREATE TEST PRICE RECORD
  ========================================================= */

  async function updateTestPriceRecord(
    testId,
    testData,
    price
  ) {

    const {
      data:
        existingPrice,
      error:
        existingError,
    } =
      await supabase
        .from("test_prices")
        .select("id")
        .eq(
          "test_id",
          String(
            testId
          )
        )
        .maybeSingle();


    if (
      existingError
    ) {

      throw existingError;

    }


    if (
      existingPrice
    ) {

      const {
        error,
      } =
        await supabase
          .from("test_prices")
          .update({

            test_name:
              testData.name ||
              "Test",

            category:
              testData.category ||
              "PATHOLOGY",

            price:
              price,

            is_active:
              testData.active !==
              false,

            updated_at:
              new Date().toISOString(),

          })
          .eq(
            "test_id",
            String(
              testId
            )
          );


      if (error) {
        throw error;
      }

    }

    else {

      const {
        error,
      } =
        await supabase
          .from("test_prices")
          .insert([
            {

              test_id:
                String(
                  testId
                ),

              test_name:
                testData.name ||
                "Test",

              category:
                testData.category ||
                "PATHOLOGY",

              price:
                price,

              is_active:
                testData.active !==
                false,

              updated_at:
                new Date().toISOString(),

            },
          ]);


      if (error) {
        throw error;
      }

    }

  }


  /* =========================================================
     DELETE TEST
  ========================================================= */

  async function deleteTest(
    test
  ) {

    const ok =
      window.confirm(
        `Kya "${test.name}" ko delete karna hai?\n\nIs test ke parameters bhi delete honge.`
      );


    if (!ok) {
      return;
    }


    try {

      setSaving(true);


      /*
       Delete parameters only if
       actual tests table record
      */

      if (
        test.source ===
        "tests"
      ) {

        const {
          error:
            parameterError,
        } =
          await supabase
            .from(
              "test_parameters"
            )
            .delete()
            .eq(
              "test_id",
              test.id
            );


        if (
          parameterError
        ) {

          throw parameterError;

        }


        const {
          error,
        } =
          await supabase
            .from("tests")
            .delete()
            .eq(
              "id",
              test.id
            );


        if (error) {
          throw error;
        }

      }


      /*
       Delete test_prices record
      */

      const {
        error:
          priceDeleteError,
      } =
        await supabase
          .from(
            "test_prices"
          )
          .delete()
          .eq(
            "test_id",
            String(
              test.id
            )
          );


      if (
        priceDeleteError
      ) {

        throw priceDeleteError;

      }


      if (
        selectedTest?.id &&
        String(
          selectedTest.id
        ) ===
          String(
            test.id
          )
      ) {

        setSelectedTest(
          null
        );

        setParameters(
          []
        );

      }


      await loadTests();


      alert(
        "Test deleted successfully."
      );

    }

    catch (error) {

      console.error(
        "Delete test error:",
        error
      );


      alert(
        "Test delete nahi hua:\n\n" +
          error.message
      );

    }

    finally {

      setSaving(false);

    }

  }


  /* =========================================================
     ACTIVE / INACTIVE
  ========================================================= */

  async function toggleActive(
    test
  ) {

    try {

      setSaving(true);


      const newActive =
        !test.active;


      /*
       Update tests table
      */

      if (
        test.source ===
        "tests"
      ) {

        const {
          error,
        } =
          await supabase
            .from("tests")
            .update({

              active:
                newActive,

              updated_at:
                new Date().toISOString(),

            })
            .eq(
              "id",
              test.id
            );


        if (error) {
          throw error;
        }

      }


      /*
       Update test_prices
      */

      const {
        data:
          existingPrice,
      } =
        await supabase
          .from(
            "test_prices"
          )
          .select("id")
          .eq(
            "test_id",
            String(
              test.id
            )
          )
          .maybeSingle();


      if (
        existingPrice
      ) {

        const {
          error,
        } =
          await supabase
            .from(
              "test_prices"
            )
            .update({

              is_active:
                newActive,

              updated_at:
                new Date().toISOString(),

            })
            .eq(
              "test_id",
              String(
                test.id
              )
            );


        if (error) {
          throw error;
        }

      }


      await loadTests();

    }

    catch (error) {

      alert(
        "Status update nahi hua:\n\n" +
          error.message
      );

    }

    finally {

      setSaving(false);

    }

  }


  /* =========================================================
     SELECT TEST
  ========================================================= */

  async function selectTest(
    test
  ) {

    setSelectedTest(
      test
    );


    setShowTestForm(
      false
    );


    setShowParameterForm(
      false
    );


    if (
      test.source ===
      "tests"
    ) {

      await loadParameters(
        test.id
      );

    }

    else {

      /*
       Old test_prices-only test
       may not have parameters
      */

      setParameters(
        []
      );

    }

  }


  /* =========================================================
     OPEN NEW PARAMETER
  ========================================================= */

  function openNewParameter() {

    if (
      !selectedTest
    ) {

      alert(
        "Pehle ek test select karein."
      );

      return;

    }


    if (
      selectedTest.source !==
      "tests"
    ) {

      alert(
        "Ye purana price-only test hai. Parameters manage karne ke liye is test ko main Test Master mein create karein."
      );

      return;

    }


    setEditingParameterId(
      null
    );


    setParameterForm({

      ...EMPTY_PARAMETER,

      sort_order:
        parameters.length +
        1,

    });


    setShowParameterForm(
      true
    );

  }


  /* =========================================================
     EDIT PARAMETER
  ========================================================= */

  function editParameter(
    parameter
  ) {

    setEditingParameterId(
      parameter.id
    );


    setParameterForm({

      parameter_name:
        parameter.parameter_name ||
        "",

      unit:
        parameter.unit ||
        "",

      min_value:
        parameter.min_value ===
          null ||
        parameter.min_value ===
          undefined
          ? ""
          : String(
              parameter.min_value
            ),

      max_value:
        parameter.max_value ===
          null ||
        parameter.max_value ===
          undefined
          ? ""
          : String(
              parameter.max_value
            ),

      reference_range:
        parameter.reference_range ||
        "",

      options:
        parameter.options
          ? JSON.stringify(
              parameter.options
            )
          : "",

      sort_order:
        parameter.sort_order ||
        1,

      active:
        parameter.active ===
          undefined
          ? true
          : parameter.active,

    });


    setShowParameterForm(
      true
    );

  }


  /* =========================================================
     SAVE PARAMETER
  ========================================================= */

  async function saveParameter(
    event
  ) {

    event.preventDefault();


    if (
      !selectedTest
    ) {

      alert(
        "Test select karein."
      );

      return;

    }


    if (
      selectedTest.source !==
      "tests"
    ) {

      alert(
        "Is test ke parameters available nahi hain."
      );

      return;

    }


    if (
      !parameterForm
        .parameter_name
        .trim()
    ) {

      alert(
        "Parameter name zaroori hai."
      );

      return;

    }


    try {

      setSaving(true);


      let options =
        {};


      if (
        parameterForm.options.trim()
      ) {

        try {

          options =
            JSON.parse(
              parameterForm.options
            );

        }

        catch {

          options = {
            text:
              parameterForm
                .options
                .trim(),
          };

        }

      }


      const payload = {

        test_id:
          selectedTest.id,

        parameter_name:
          parameterForm
            .parameter_name
            .trim(),

        unit:
          parameterForm.unit
            .trim(),

        min_value:
          parameterForm
            .min_value ===
          ""
            ? null
            : Number(
                parameterForm
                  .min_value
              ),

        max_value:
          parameterForm
            .max_value ===
          ""
            ? null
            : Number(
                parameterForm
                  .max_value
              ),

        reference_range:
          parameterForm
            .reference_range
            .trim(),

        options:
          options,

        sort_order:
          Number(
            parameterForm
              .sort_order
          ) || 1,

        active:
          parameterForm.active,

      };


      if (
        editingParameterId
      ) {

        const {
          error,
        } =
          await supabase
            .from(
              "test_parameters"
            )
            .update(
              payload
            )
            .eq(
              "id",
              editingParameterId
            );


        if (error) {
          throw error;
        }


        alert(
          "Parameter updated successfully."
        );

      }

      else {

        const {
          error,
        } =
          await supabase
            .from(
              "test_parameters"
            )
            .insert([
              payload,
            ]);


        if (error) {
          throw error;
        }


        alert(
          "Parameter added successfully."
        );

      }


      await loadParameters(
        selectedTest.id
      );


      setShowParameterForm(
        false
      );


      setEditingParameterId(
        null
      );


      setParameterForm(
        EMPTY_PARAMETER
      );

    }

    catch (error) {

      console.error(
        "Parameter save error:",
        error
      );


      alert(
        "Parameter save nahi hua:\n\n" +
          error.message
      );

    }

    finally {

      setSaving(false);

    }

  }


  /* =========================================================
     DELETE PARAMETER
  ========================================================= */

  async function deleteParameter(
    parameter
  ) {

    const ok =
      window.confirm(
        `Kya "${parameter.parameter_name}" parameter delete karna hai?`
      );


    if (!ok) {
      return;
    }


    try {

      setSaving(true);


      const {
        error,
      } =
        await supabase
          .from(
            "test_parameters"
          )
          .delete()
          .eq(
            "id",
            parameter.id
          );


      if (error) {
        throw error;
      }


      await loadParameters(
        selectedTest.id
      );


      alert(
        "Parameter deleted."
      );

    }

    catch (error) {

      alert(
        "Parameter delete nahi hua:\n\n" +
          error.message
      );

    }

    finally {

      setSaving(false);

    }

  }


  /* =========================================================
     FILTER TESTS
  ========================================================= */

  const filteredTests =
    tests.filter(
      (test) => {

        const text =
          search
            .toLowerCase()
            .trim();


        const testName =
          String(
            test.name || ""
          ).toLowerCase();


        const shortName =
          String(
            test.short_name ||
              ""
          ).toLowerCase();


        const testCategory =
          String(
            test.category ||
              ""
          ).toLowerCase();


        const matchesSearch =
          !text ||
          testName.includes(
            text
          ) ||
          shortName.includes(
            text
          ) ||
          testCategory.includes(
            text
          );


        const matchesCategory =
          category ===
            "All" ||
          test.category ===
            category;


        return (
          matchesSearch &&
          matchesCategory
        );

      }
    );


  /* =========================================================
     UI
  ========================================================= */

  return (

    <div
      style={{
        minHeight:
          "100vh",

        background:
          "#f4f7fa",

        fontFamily:
          "Arial, Helvetica, sans-serif",

      }}
    >

      {/* ===================================================
          TOP BAR
      =================================================== */}

      <header
        style={{
          background:
            "#ffffff",

          borderBottom:
            "1px solid #e2e8ef",

          padding:
            "16px 22px",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          gap:
            "15px",

          position:
            "sticky",

          top:
            0,

          zIndex:
            20,

          flexWrap:
            "wrap",

        }}
      >

        <div>

          <div
            style={{
              fontSize:
                "12px",

              fontWeight:
                "800",

              color:
                "#079b94",

              letterSpacing:
                "1px",

            }}
          >
            NIDAN PATHOLOGY LAB
          </div>


          <h1
            style={{
              margin:
                "4px 0",

              fontSize:
                "24px",

              color:
                "#172536",

            }}
          >
            Test Master
          </h1>


          <p
            style={{
              margin:
                0,

              color:
                "#718096",

              fontSize:
                "13px",

            }}
          >
            Tests, prices, parameters &
            reference ranges manage karein
          </p>

        </div>


        <div
          style={{
            display:
              "flex",

            gap:
              "8px",

            flexWrap:
              "wrap",

          }}
        >

          <button
            onClick={() =>
              router.push(
                "/"
              )
            }
            style={
              buttonStyle(
                "#ffffff",
                "#334155"
              )
            }
          >
            ← Dashboard
          </button>


          <button
            onClick={
              openNewTest
            }
            style={
              buttonStyle(
                "#0e9f99",
                "#ffffff"
              )
            }
          >
            + New Test
          </button>

        </div>

      </header>


      {/* ===================================================
          MAIN
      =================================================== */}

      <main
        style={{
          padding:
            "20px",

          maxWidth:
            "1500px",

          margin:
            "auto",

        }}
      >


        {/* =================================================
            SEARCH
        ================================================= */}

        <section
          style={{
            background:
              "#ffffff",

            border:
              "1px solid #e2e8ef",

            borderRadius:
              "12px",

            padding:
              "15px",

            marginBottom:
              "18px",

          }}
        >

          <div
            style={{
              display:
                "flex",

              gap:
                "10px",

              flexWrap:
                "wrap",

            }}
          >

            <input
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="🔎 Search test name..."
              style={
                inputStyle
              }
            />


            <select
              value={
                category
              }
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              style={{
                ...inputStyle,

                maxWidth:
                  "240px",

              }}
            >

              <option value="All">
                All Categories
              </option>


              {CATEGORIES.map(
                (item) => (

                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>

                )
              )}

            </select>

          </div>

        </section>


        {/* =================================================
            GRID
        ================================================= */}

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "minmax(0, 1.2fr) minmax(360px, 0.8fr)",

            gap:
              "18px",

          }}
        >


          {/* ===============================================
              TEST LIST
          =============================================== */}

          <section
            style={{
              background:
                "#ffffff",

              border:
                "1px solid #e2e8ef",

              borderRadius:
                "12px",

              overflow:
                "hidden",

            }}
          >

            <div
              style={{
                padding:
                  "16px",

                borderBottom:
                  "1px solid #e8edf2",

                display:
                  "flex",

                justifyContent:
                  "space-between",

              }}
            >

              <div>

                <h2
                  style={{
                    margin:
                      0,

                    fontSize:
                      "18px",

                  }}
                >
                  Laboratory Tests
                </h2>


                <p
                  style={{
                    margin:
                      "5px 0 0",

                    color:
                      "#7b8795",

                    fontSize:
                      "12px",

                  }}
                >
                  {filteredTests.length} tests
                </p>

              </div>

            </div>


            {loading ? (

              <div
                style={
                  emptyStyle
                }
              >
                Loading tests...
              </div>

            ) : filteredTests.length === 0 ? (

              <div
                style={
                  emptyStyle
                }
              >

                <div
                  style={{
                    fontSize:
                      "35px",
                  }}
                >
                  🧪
                </div>


                <strong>
                  No tests found
                </strong>


                <p>
                  + New Test से पहला test
                  add करें।
                </p>

              </div>

            ) : (

              <div>

                {filteredTests.map(
                  (test) => {

                    const selected =
                      selectedTest?.id ===
                      test.id;


                    return (

                      <div
                        key={
                          String(
                            test.id
                          )
                        }
                        onClick={() =>
                          selectTest(
                            test
                          )
                        }
                        style={{
                          padding:
                            "15px",

                          borderBottom:
                            "1px solid #edf1f5",

                          cursor:
                            "pointer",

                          background:
                            selected
                              ? "#ecfbf9"
                              : "#ffffff",

                        }}
                      >

                        <div
                          style={{
                            display:
                              "flex",

                            justifyContent:
                              "space-between",

                            gap:
                              "10px",

                            flexWrap:
                              "wrap",

                          }}
                        >


                          {/* TEST INFO */}

                          <div
                            style={{
                              minWidth:
                                "180px",

                              flex:
                                1,

                            }}
                          >

                            <strong
                              style={{
                                fontSize:
                                  "16px",

                                color:
                                  "#172536",

                              }}
                            >
                              {test.short_name ||
                                test.name}
                            </strong>


                            <div
                              style={{
                                marginTop:
                                  "4px",

                                color:
                                  "#596778",

                                fontSize:
                                  "13px",

                              }}
                            >
                              {test.name}
                            </div>


                            <div
                              style={{
                                marginTop:
                                  "8px",

                                display:
                                  "flex",

                                gap:
                                  "6px",

                                flexWrap:
                                  "wrap",

                              }}
                            >

                              <Badge>
                                {
                                  test.category
                                }
                              </Badge>


                              <Badge>
                                ₹
                                {Number(
                                  test.price ||
                                    0
                                )}
                              </Badge>


                              <Badge>
                                {test.sample_type ||
                                  "Sample not set"}
                              </Badge>

                            </div>

                          </div>


                          {/* ACTIONS */}

                          <div
                            style={{
                              display:
                                "flex",

                              flexDirection:
                                "column",

                              gap:
                                "6px",

                              alignItems:
                                "flex-end",

                            }}
                          >

                            <span
                              style={{
                                fontSize:
                                  "11px",

                                fontWeight:
                                  "800",

                                color:
                                  test.active
                                    ? "#087f68"
                                    : "#a04444",

                              }}
                            >
                              {test.active
                                ? "ACTIVE"
                                : "INACTIVE"}
                            </span>


                            <div
                              style={{
                                display:
                                  "flex",

                                gap:
                                  "5px",

                                flexWrap:
                                  "wrap",

                                justifyContent:
                                  "flex-end",

                              }}
                            >

                              {/* PRICE BUTTON */}

                              <button
                                onClick={(
                                  e
                                ) => {

                                  e.stopPropagation();

                                  openPriceEdit(
                                    test
                                  );

                                }}
                                style={{
                                  ...smallButton,

                                  background:
                                    "#fff9df",

                                  border:
                                    "1px solid #e7d47a",

                                  color:
                                    "#7a5b00",

                                  fontWeight:
                                    "800",

                                }}
                              >
                                💰 Edit Price
                              </button>


                              {/* EDIT */}

                              <button
                                onClick={(
                                  e
                                ) => {

                                  e.stopPropagation();

                                  editTest(
                                    test
                                  );

                                }}
                                style={
                                  smallButton
                                }
                              >
                                Edit
                              </button>


                              {/* ACTIVE */}

                              <button
                                onClick={(
                                  e
                                ) => {

                                  e.stopPropagation();

                                  toggleActive(
                                    test
                                  );

                                }}
                                style={
                                  smallButton
                                }
                              >
                                {test.active
                                  ? "Disable"
                                  : "Enable"}
                              </button>


                              {/* DELETE */}

                              <button
                                onClick={(
                                  e
                                ) => {

                                  e.stopPropagation();

                                  deleteTest(
                                    test
                                  );

                                }}
                                style={{
                                  ...smallButton,

                                  color:
                                    "#b42323",

                                }}
                              >
                                Delete
                              </button>

                            </div>

                          </div>

                        </div>

                      </div>

                    );

                  }
                )}

              </div>

            )}

          </section>


          {/* =================================================
              RIGHT PANEL
          ================================================= */}

          <section
            style={{
              background:
                "#ffffff",

              border:
                "1px solid #e2e8ef",

              borderRadius:
                "12px",

              overflow:
                "hidden",

              alignSelf:
                "start",

            }}
          >

            {!selectedTest ? (

              <div
                style={
                  emptyStyle
                }
              >

                <div
                  style={{
                    fontSize:
                      "40px",
                  }}
                >
                  🧪
                </div>


                <h3>
                  Select a Test
                </h3>


                <p>
                  Parameters manage करने के
                  लिए left side से test select
                  करें।
                </p>


                <button
                  onClick={
                    openNewTest
                  }
                  style={
                    buttonStyle(
                      "#0e9f99",
                      "#ffffff"
                    )
                  }
                >
                  + New Test
                </button>

              </div>

            ) : (

              <>

                {/* =========================================
                    SELECTED TEST
                ========================================= */}

                <div
                  style={{
                    padding:
                      "16px",

                    borderBottom:
                      "1px solid #e8edf2",

                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      gap:
                        "10px",

                      flexWrap:
                        "wrap",

                    }}
                  >

                    <div>

                      <div
                        style={{
                          fontSize:
                            "11px",

                          fontWeight:
                            "800",

                          color:
                            "#079b94",

                        }}
                      >
                        SELECTED TEST
                      </div>


                      <h2
                        style={{
                          margin:
                            "4px 0",

                          fontSize:
                            "20px",

                        }}
                      >
                        {
                          selectedTest.name
                        }
                      </h2>


                      <p
                        style={{
                          margin:
                            0,

                          color:
                            "#687789",

                          fontSize:
                            "12px",

                        }}
                      >
                        {
                          selectedTest.category
                        }{" "}
                        • ₹
                        {Number(
                          selectedTest.price ||
                            0
                        )}
                      </p>

                    </div>


                    <div
                      style={{
                        display:
                          "flex",

                        gap:
                          "6px",

                        flexWrap:
                          "wrap",

                      }}
                    >

                      {/* PRICE */}

                      <button
                        onClick={() =>
                          openPriceEdit(
                            selectedTest
                          )
                        }
                        style={{
                          ...smallButton,

                          background:
                            "#fff9df",

                          border:
                            "1px solid #e7d47a",

                          color:
                            "#7a5b00",

                        }}
                      >
                        💰 Edit Price
                      </button>


                      {/* EDIT */}

                      <button
                        onClick={() =>
                          editTest(
                            selectedTest
                          )
                        }
                        style={
                          smallButton
                        }
                      >
                        ✏️ Edit Test
                      </button>

                    </div>

                  </div>

                </div>


                {/* =========================================
                    PARAMETERS
                ========================================= */}

                <div
                  style={{
                    padding:
                      "16px",

                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",

                      justifyContent:
                        "space-between",

                      alignItems:
                        "center",

                      marginBottom:
                        "12px",

                      gap:
                        "10px",

                      flexWrap:
                        "wrap",

                    }}
                  >

                    <div>

                      <h3
                        style={{
                          margin:
                            0,
                        }}
                      >
                        Test Parameters
                      </h3>


                      <p
                        style={{
                          margin:
                            "4px 0 0",

                          color:
                            "#7b8795",

                          fontSize:
                            "12px",

                        }}
                      >
                        {parameters.length}{" "}
                        parameters
                      </p>

                    </div>


                    <button
                      onClick={
                        openNewParameter
                      }
                      style={
                        buttonStyle(
                          "#0e9f99",
                          "#ffffff"
                        )
                      }
                    >
                      + Add Parameter
                    </button>

                  </div>


                  {parameters.length ===
                  0 ? (

                    <div
                      style={{
                        padding:
                          "25px 10px",

                        textAlign:
                          "center",

                        border:
                          "1px dashed #cbd5df",

                        borderRadius:
                          "8px",

                      }}
                    >

                      <div
                        style={{
                          fontSize:
                            "28px",
                        }}
                      >
                        📋
                      </div>


                      <strong>
                        No parameters
                      </strong>


                      <p
                        style={{
                          fontSize:
                            "12px",

                          color:
                            "#7b8795",

                        }}
                      >
                        Add Parameter पर
                        tap करें।
                      </p>

                    </div>

                  ) : (

                    <div
                      style={{
                        display:
                          "flex",

                        flexDirection:
                          "column",

                        gap:
                          "8px",

                      }}
                    >

                      {parameters.map(
                        (
                          parameter
                        ) => (

                          <div
                            key={
                              parameter.id
                            }
                            style={{
                              border:
                                "1px solid #e4e9ef",

                              borderRadius:
                                "8px",

                              padding:
                                "10px",

                            }}
                          >

                            <div
                              style={{
                                display:
                                  "flex",

                                justifyContent:
                                  "space-between",

                                gap:
                                  "8px",

                              }}
                            >

                              <div>

                                <strong>
                                  {
                                    parameter.parameter_name
                                  }
                                </strong>


                                <div
                                  style={{
                                    fontSize:
                                      "11px",

                                    color:
                                      "#64748b",

                                    marginTop:
                                      "4px",

                                  }}
                                >
                                  Unit:{" "}
                                  {parameter.unit ||
                                    "—"}
                                </div>


                                <div
                                  style={{
                                    fontSize:
                                      "11px",

                                    color:
                                      "#64748b",

                                    marginTop:
                                      "3px",

                                  }}
                                >
                                  Reference:{" "}
                                  {parameter.reference_range ||
                                    "—"}
                                </div>

                              </div>


                              <div
                                style={{
                                  display:
                                    "flex",

                                  gap:
                                    "5px",

                                }}
                              >

                                <button
                                  onClick={() =>
                                    editParameter(
                                      parameter
                                    )
                                  }
                                  style={
                                    smallButton
                                  }
                                >
                                  Edit
                                </button>


                                <button
                                  onClick={() =>
                                    deleteParameter(
                                      parameter
                                    )
                                  }
                                  style={{
                                    ...smallButton,

                                    color:
                                      "#b42323",

                                  }}
                                >
                                  Delete
                                </button>

                              </div>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>

              </>

            )}

          </section>

        </div>

      </main>


      {/* =====================================================
          PRICE EDIT MODAL
      ====================================================== */}

      {showPriceForm && (

        <div
          style={
            overlayStyle
          }
        >

          <div
            style={{
              ...modalStyle,

              maxWidth:
                "450px",

            }}
          >

            <div
              style={
                modalHeader
              }
            >

              <div>

                <div
                  style={{
                    fontSize:
                      "11px",

                    fontWeight:
                      "800",

                    color:
                      "#079b94",

                    letterSpacing:
                      "1px",

                  }}
                >
                  TEST PRICE
                </div>


                <h2
                  style={{
                    margin:
                      "4px 0",

                    color:
                      "#172536",

                  }}
                >
                  Edit Test Price
                </h2>


                <p
                  style={{
                    margin:
                      0,

                    fontSize:
                      "13px",

                    color:
                      "#718096",

                  }}
                >
                  {priceEditTest?.name}
                </p>

              </div>


              <button
                onClick={() => {

                  setShowPriceForm(
                    false
                  );

                  setPriceEditTest(
                    null
                  );

                }}
                style={
                  closeButton
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                savePrice
              }
            >

              <div
                style={{
                  background:
                    "#f7fafc",

                  border:
                    "1px solid #e2e8ef",

                  borderRadius:
                    "8px",

                  padding:
                    "12px",

                  marginBottom:
                    "15px",

                }}
              >

                <div
                  style={{
                    fontSize:
                      "11px",

                    color:
                      "#718096",

                  }}
                >
                  Current Price
                </div>


                <div
                  style={{
                    fontSize:
                      "22px",

                    fontWeight:
                      "800",

                    color:
                      "#172536",

                    marginTop:
                      "3px",

                  }}
                >
                  ₹
                  {Number(
                    priceEditTest?.price ||
                      0
                  )}
                </div>

              </div>


              <label
                style={
                  labelStyle
                }
              >
                New Price ₹
              </label>


              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  newPrice
                }
                onChange={(e) =>
                  setNewPrice(
                    e.target.value
                  )
                }
                placeholder="Enter new price"
                autoFocus
                style={{
                  ...inputStyle,

                  fontSize:
                    "18px",

                  fontWeight:
                    "700",

                }}
              />


              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "flex-end",

                  gap:
                    "8px",

                  marginTop:
                    "20px",

                }}
              >

                <button
                  type="button"
                  onClick={() => {

                    setShowPriceForm(
                      false
                    );

                    setPriceEditTest(
                      null
                    );

                  }}
                  style={
                    buttonStyle(
                      "#ffffff",
                      "#475569"
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  style={
                    buttonStyle(
                      "#0e9f99",
                      "#ffffff"
                    )
                  }
                >
                  {saving
                    ? "Saving..."
                    : "💾 Save Price"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          TEST FORM MODAL
      ====================================================== */}

      {showTestForm && (

        <div
          style={
            overlayStyle
          }
        >

          <div
            style={
              modalStyle
            }
          >

            <div
              style={
                modalHeader
              }
            >

              <div>

                <h2>
                  {editingTestId
                    ? "Edit Test"
                    : "Add New Test"}
                </h2>


                <p>
                  Test ki basic information
                </p>

              </div>


              <button
                onClick={() =>
                  setShowTestForm(
                    false
                  )
                }
                style={
                  closeButton
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                saveTest
              }
            >

              <div
                style={
                  formGrid
                }
              >

                <Field
                  label="Test Name *"
                  value={
                    testForm.name
                  }
                  onChange={(
                    value
                  ) =>
                    setTestForm({
                      ...testForm,
                      name:
                        value,
                    })
                  }
                  placeholder="Complete Blood Count"
                />


                <Field
                  label="Short Name"
                  value={
                    testForm.short_name
                  }
                  onChange={(
                    value
                  ) =>
                    setTestForm({
                      ...testForm,
                      short_name:
                        value,
                    })
                  }
                  placeholder="CBC"
                />


                <SelectField
                  label="Category"
                  value={
                    testForm.category
                  }
                  onChange={(
                    value
                  ) =>
                    setTestForm({
                      ...testForm,
                      category:
                        value,
                    })
                  }
                  options={
                    CATEGORIES
                  }
                />


                <Field
                  label="Department"
                  value={
                    testForm.department
                  }
                  onChange={(
                    value
                  ) =>
                    setTestForm({
                      ...testForm,
                      department:
                        value,
                    })
                  }
                  placeholder="Laboratory"
                />


                <Field
                  label="Sample Type"
                  value={
                    testForm.sample_type
                  }
                  onChange={(
                    value
                  ) =>
                    setTestForm({
                      ...testForm,
                      sample_type:
                        value,
                    })
                  }
                  placeholder="EDTA Blood / Serum / Urine"
                />


                <Field
                  label="Price ₹"
                  type="number"
                  value={
                    testForm.price
                  }
                  onChange={(
                    value
                  ) =>
                    setTestForm({
                      ...testForm,
                      price:
                        value,
                    })
                  }
                  placeholder="250"
                />


                <Field
                  label="Method"
                  value={
                    testForm.method
                  }
                  onChange={(
                    value
                  ) =>
                    setTestForm({
                      ...testForm,
                      method:
                        value,
                    })
                  }
                  placeholder="Automated / Manual"
                />

              </div>


              <label
                style={{
                  display:
                    "flex",

                  gap:
                    "8px",

                  alignItems:
                    "center",

                  marginTop:
                    "15px",

                  fontSize:
                    "13px",

                  fontWeight:
                    "700",

                }}
              >

                <input
                  type="checkbox"
                  checked={
                    testForm.active
                  }
                  onChange={(e) =>
                    setTestForm({
                      ...testForm,
                      active:
                        e.target.checked,
                    })
                  }
                />

                Active Test

              </label>


              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "flex-end",

                  gap:
                    "8px",

                  marginTop:
                    "20px",

                }}
              >

                <button
                  type="button"
                  onClick={() =>
                    setShowTestForm(
                      false
                    )
                  }
                  style={
                    buttonStyle(
                      "#ffffff",
                      "#475569"
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  style={
                    buttonStyle(
                      "#0e9f99",
                      "#ffffff"
                    )
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingTestId
                    ? "Update Test"
                    : "Save Test"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          PARAMETER FORM MODAL
      ====================================================== */}

      {showParameterForm && (

        <div
          style={
            overlayStyle
          }
        >

          <div
            style={
              modalStyle
            }
          >

            <div
              style={
                modalHeader
              }
            >

              <div>

                <h2>
                  {editingParameterId
                    ? "Edit Parameter"
                    : "Add Parameter"}
                </h2>


                <p>
                  {
                    selectedTest?.name
                  }
                </p>

              </div>


              <button
                onClick={() =>
                  setShowParameterForm(
                    false
                  )
                }
                style={
                  closeButton
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                saveParameter
              }
            >

              <Field
                label="Parameter Name *"
                value={
                  parameterForm.parameter_name
                }
                onChange={(
                  value
                ) =>
                  setParameterForm({
                    ...parameterForm,
                    parameter_name:
                      value,
                  })
                }
                placeholder="Haemoglobin"
              />


              <div
                style={
                  formGrid
                }
              >

                <Field
                  label="Unit"
                  value={
                    parameterForm.unit
                  }
                  onChange={(
                    value
                  ) =>
                    setParameterForm({
                      ...parameterForm,
                      unit:
                        value,
                    })
                  }
                  placeholder="g/dL"
                />


                <Field
                  label="Minimum Value"
                  type="number"
                  value={
                    parameterForm.min_value
                  }
                  onChange={(
                    value
                  ) =>
                    setParameterForm({
                      ...parameterForm,
                      min_value:
                        value,
                    })
                  }
                  placeholder="13"
                />


                <Field
                  label="Maximum Value"
                  type="number"
                  value={
                    parameterForm.max_value
                  }
                  onChange={(
                    value
                  ) =>
                    setParameterForm({
                      ...parameterForm,
                      max_value:
                        value,
                    })
                  }
                  placeholder="17"
                />


                <Field
                  label="Sort Order"
                  type="number"
                  value={
                    parameterForm.sort_order
                  }
                  onChange={(
                    value
                  ) =>
                    setParameterForm({
                      ...parameterForm,
                      sort_order:
                        value,
                    })
                  }
                  placeholder="1"
                />

              </div>


              <Field
                label="Reference Range"
                value={
                  parameterForm.reference_range
                }
                onChange={(
                  value
                ) =>
                  setParameterForm({
                    ...parameterForm,
                    reference_range:
                      value,
                  })
                }
                placeholder="Male: 13-17 | Female: 12-15"
              />


              <label
                style={
                  labelStyle
                }
              >
                Options / Text
              </label>


              <textarea
                value={
                  parameterForm.options
                }
                onChange={(e) =>
                  setParameterForm({
                    ...parameterForm,
                    options:
                      e.target.value,
                  })
                }
                placeholder='Example: {"choices":["Positive","Negative"]}'
                style={{
                  ...inputStyle,

                  minHeight:
                    "80px",

                  resize:
                    "vertical",

                }}
              />


              <label
                style={{
                  display:
                    "flex",

                  gap:
                    "8px",

                  alignItems:
                    "center",

                  marginTop:
                    "12px",

                  fontSize:
                    "13px",

                  fontWeight:
                    "700",

                }}
              >

                <input
                  type="checkbox"
                  checked={
                    parameterForm.active
                  }
                  onChange={(e) =>
                    setParameterForm({
                      ...parameterForm,
                      active:
                        e.target.checked,
                    })
                  }
                />

                Active Parameter

              </label>


              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "flex-end",

                  gap:
                    "8px",

                  marginTop:
                    "20px",

                }}
              >

                <button
                  type="button"
                  onClick={() =>
                    setShowParameterForm(
                      false
                    )
                  }
                  style={
                    buttonStyle(
                      "#ffffff",
                      "#475569"
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  style={
                    buttonStyle(
                      "#0e9f99",
                      "#ffffff"
                    )
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingParameterId
                    ? "Update Parameter"
                    : "Save Parameter"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );
}


/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {

  return (

    <div>

      <label
        style={
          labelStyle
        }
      >
        {label}
      </label>


      <input
        type={type}
        value={
          value ?? ""
        }
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
        style={
          inputStyle
        }
      />

    </div>

  );

}


/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  label,
  value,
  onChange,
  options,
}) {

  return (

    <div>

      <label
        style={
          labelStyle
        }
      >
        {label}
      </label>


      <select
        value={
          value
        }
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        style={
          inputStyle
        }
      >

        {options.map(
          (item) => (

            <option
              key={item}
              value={item}
            >
              {item}
            </option>

          )
        )}

      </select>

    </div>

  );

}


/* =========================================================
   BADGE
========================================================= */

function Badge({
  children,
}) {

  return (

    <span
      style={{
        background:
          "#eef5f7",

        color:
          "#536674",

        borderRadius:
          "15px",

        padding:
          "4px 8px",

        fontSize:
          "10px",

        fontWeight:
          "700",

      }}
    >
      {children}
    </span>

  );

}


/* =========================================================
   STYLES
========================================================= */

const inputStyle = {

  width:
    "100%",

  boxSizing:
    "border-box",

  padding:
    "11px 12px",

  border:
    "1px solid #d7e0e8",

  borderRadius:
    "7px",

  outline:
    "none",

  fontSize:
    "13px",

  background:
    "#ffffff",

};


const labelStyle = {

  display:
    "block",

  marginBottom:
    "6px",

  fontSize:
    "12px",

  fontWeight:
    "800",

  color:
    "#344054",

};


const formGrid = {

  display:
    "grid",

  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",

  gap:
    "12px",

};


const buttonStyle = (
  background,
  color
) => ({

  border:
    "1px solid #d6dee6",

  background:

    background,

  color:

    color,

  padding:
    "9px 13px",

  borderRadius:
    "7px",

  cursor:
    "pointer",

  fontWeight:
    "800",

  fontSize:
    "12px",

});


const smallButton = {

  border:
    "1px solid #d6dee6",

  background:
    "#ffffff",

  color:
    "#176b67",

  padding:
    "5px 8px",

  borderRadius:
    "5px",

  cursor:
    "pointer",

  fontWeight:
    "700",

  fontSize:
    "10px",

};


const emptyStyle = {

  padding:
    "50px 20px",

  textAlign:
    "center",

  color:
    "#718096",

};


const overlayStyle = {

  position:
    "fixed",

  inset:
    0,

  background:
    "rgba(15, 23, 42, 0.45)",

  display:
    "flex",

  justifyContent:
    "center",

  alignItems:
    "center",

  padding:
    "20px",

  zIndex:
    100,

};


const modalStyle = {

  background:
    "#ffffff",

  width:
    "100%",

  maxWidth:
    "650px",

  maxHeight:
    "90vh",

  overflowY:
    "auto",

  borderRadius:
    "12px",

  padding:
    "20px",

  boxShadow:
    "0 20px 60px rgba(0,0,0,0.2)",

};


const modalHeader = {

  display:
    "flex",

  justifyContent:
    "space-between",

  gap:
    "15px",

  alignItems:
    "flex-start",

  marginBottom:
    "18px",

};


const closeButton = {

  border:
    "none",

  background:
    "#f1f5f9",

  width:
    "32px",

  height:
    "32px",

  borderRadius:
    "50%",

  cursor:
    "pointer",

  fontSize:
    "22px",

};
