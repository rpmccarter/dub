import { CheckCircleFill } from "@/ui/shared/icons";
import { Button, LoadingSpinner, useEnterSubmit } from "@dub/ui";
import { cn } from "@dub/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Image, Trash2, UploadCloud } from "lucide-react";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";

export function ContactForm({
  setScreen,
}: {
  setScreen: Dispatch<SetStateAction<"main" | "contact">>;
}) {
  const [data, setData] = useState<{
    message: string;
    attachmentIds: string[];
  }>({
    message: "",
    attachmentIds: [],
  });

  const [images, setImages] = useState<
    {
      file: File;
      uploading: boolean;
      attachmentId?: string;
    }[]
  >([]);

  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (file: File) => {
    setImages((prev) => [...prev, { file, uploading: true }]);

    const {
      attachment: { id: attachmentId },
      uploadFormUrl,
      uploadFormData,
    } = await fetch(`/api/support/upload?name=${file.name}&size=${file.size}`, {
      method: "GET",
    }).then((res) => res.json());

    console.log({ uploadFormUrl, attachmentId });

    const form = new FormData();
    uploadFormData.forEach(({ key, value }) => {
      form.append(key, value);
    });
    form.append("file", file);

    fetch(uploadFormUrl, {
      method: "POST",
      body: form,
    })
      .then((res) => {
        if (!res.ok) {
          toast.error(res.statusText);
        }
      })
      .catch((err) => {
        console.error("Error uploading file:", err.message ? err.message : err);
      });

    setImages((prev) =>
      prev.map((image) =>
        image.file === file
          ? { ...image, uploading: false, attachmentId }
          : image,
      ),
    );
    setData((prev) => ({
      ...prev,
      attachmentIds: [...prev.attachmentIds, attachmentId],
    }));
  };

  const formRef = useRef<HTMLFormElement>(null);
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success">(
    "idle",
  );

  const { handleKeyDown } = useEnterSubmit(formRef);

  return (
    <div className="w-full px-6 py-5">
      <button
        type="button"
        className="-ml-2 flex items-center space-x-1 rounded-md px-2 py-1"
        onClick={() => setScreen("main")}
      >
        <ChevronLeft className="h-4 w-4" />
        <h3 className="font-semibold">Contact support</h3>
      </button>

      <AnimatePresence>
        {formStatus === "success" ? (
          <motion.div
            className="flex h-[280px] flex-col items-center justify-center space-y-3 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <CheckCircleFill className="h-5 w-5 text-green-500" />
            <p className="text-gray-500">
              Thanks for reaching out! <br /> We'll get back to you as soon as
              possible.
            </p>
          </motion.div>
        ) : (
          <motion.form
            ref={formRef}
            className="mt-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setFormStatus("loading");
              const res = await fetch("/api/support", {
                method: "POST",
                body: JSON.stringify(data),
              }).then((res) => res.json());
              if (res.error) {
                toast.error(res.error);
              } else {
                toast.success("Message sent!");
                setData({ message: "", attachmentIds: [] });
              }
              setFormStatus("success");
            }}
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <label className="block w-full">
              <span className="block text-sm font-medium text-gray-700">
                Describe the issue
              </span>
              <TextareaAutosize
                name="message"
                required
                placeholder="E.g. My custom domain is not working."
                minRows={8}
                autoComplete="off"
                value={data.message}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, message: e.target.value }))
                }
                onKeyDown={handleKeyDown}
                className={`${
                  false
                    ? "border-red-300 pr-10 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 text-gray-900 placeholder-gray-300 focus:border-gray-500 focus:ring-gray-500"
                } mt-1 block w-full resize-none rounded-md focus:outline-none sm:text-sm`}
              />
            </label>

            <div className="mt-2 grid w-full gap-2">
              {images.map((image) => (
                <div
                  key={image.attachmentId}
                  className="flex w-full items-center justify-between rounded-md border border-gray-200"
                >
                  <div className="flex flex-1 items-center space-x-2 p-2">
                    {image.uploading ? (
                      <LoadingSpinner className="h-4 w-4" />
                    ) : (
                      <Image className="h-4 w-4 text-gray-500" />
                    )}
                    <p className="text-center text-sm text-gray-500">
                      {image.file.name}
                    </p>
                  </div>
                  <button
                    className="h-full rounded-r-md border-l border-gray-200 p-2"
                    onClick={() => {
                      setImages((prev) =>
                        prev.filter((i) => i.file.name !== image.file.name),
                      );
                      setData((prev) => ({
                        ...prev,
                        attachmentIds: prev.attachmentIds.filter(
                          (id) => id !== image.attachmentId,
                        ),
                      }));
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>

            <label
              htmlFor="image"
              className="group relative mt-1 flex aspect-[5/1] w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-white transition-all"
            >
              <div
                className="absolute z-[5] h-full w-full rounded-md"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                  const file = e.dataTransfer.files && e.dataTransfer.files[0];
                  if (!file) return;
                  await handleUpload(file);
                }}
              />
              <div
                className={cn(
                  "absolute z-[3] flex h-full w-full flex-col items-center justify-center rounded-md bg-white transition-all",
                  {
                    "cursor-copy border-2 border-black bg-gray-50 opacity-100":
                      dragActive,
                  },
                )}
              >
                <UploadCloud
                  className={`${
                    dragActive ? "scale-110" : "scale-100"
                  } h-5 w-5 text-gray-500 transition-all duration-75 group-hover:scale-110 group-active:scale-95`}
                />
                <p className="mt-2 text-center text-sm text-gray-500">
                  Drag and drop or click to upload.
                </p>
                <span className="sr-only">Image upload</span>
              </div>
            </label>
            <input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                await handleUpload(file);
              }}
            />

            <Button
              className="mt-3 h-9"
              disabled={!data.message}
              loading={formStatus === "loading"}
              text="Send message"
            />
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}