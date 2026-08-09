import { Plus } from "lucide-react-native";
import { useState } from "react";
import { Alert } from "react-native";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useCatalog } from "@/contexts/catalog-context";

export function CreatePlaylistDialog() {
  const { createPlaylist } = useCatalog();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const value = name.trim();
    if (!value) return;
    setSaving(true);
    try {
      await createPlaylist(value);
      setName("");
      setOpen(false);
    } catch (cause) {
      Alert.alert(
        "Could not create playlist",
        cause instanceof Error ? cause.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value && !saving) setName("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Icon as={Plus} />
          <Text>New playlist</Text>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create playlist</DialogTitle>
          <DialogDescription>Give the playlist a name. You can add tracks from their action menu.</DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Playlist name"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={saving}>
              <Text>Cancel</Text>
            </Button>
          </DialogClose>
          <Button disabled={!name.trim() || saving} onPress={() => void submit()}>
            <Text>{saving ? "Creating…" : "Create"}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
